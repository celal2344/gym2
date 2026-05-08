from django.utils import timezone
from rest_framework import viewsets
from rest_framework.response import Response

from .audit import log_audit_event
from .models import StaffMember, TrainingProgram, TrainingProgramAssignment
from .permissions import IsProgramAssigner
from .serializers import TrainingProgramAssignmentSerializer, TrainingProgramSerializer


class OrganizationScopedProgramMixin:
    permission_classes = [IsProgramAssigner]

    def get_request_organization(self):
        return getattr(getattr(self.request, "user", None), "organization", None)

    def get_request_staff_member(self):
        return getattr(getattr(self.request, "user", None), "staff_member", None)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_request_organization()
        return context


class TrainingProgramViewSet(OrganizationScopedProgramMixin, viewsets.ModelViewSet):
    serializer_class = TrainingProgramSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return TrainingProgram.objects.none()
        queryset = TrainingProgram.objects.select_related("organization", "created_by").filter(organization=organization)
        if self.request.query_params.get("include_inactive") != "true":
            queryset = queryset.filter(is_active=True)
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by("title")

    def perform_create(self, serializer):
        program = serializer.save()
        log_audit_event(
            self.request,
            action="training_program.created",
            target=program,
            summary=f"Created training program {program.title}",
        )

    def perform_update(self, serializer):
        program = serializer.save()
        log_audit_event(
            self.request,
            action="training_program.updated",
            target=program,
            summary=f"Updated training program {program.title}",
        )

    def destroy(self, request, *args, **kwargs):
        program = self.get_object()
        program.is_active = False
        program.status = TrainingProgram.Status.ARCHIVED
        program.save(update_fields=["is_active", "status", "updated_at"])
        log_audit_event(
            request,
            action="training_program.archived",
            target=program,
            summary=f"Archived training program {program.title}",
        )
        return Response(self.get_serializer(program).data)


class TrainingProgramAssignmentViewSet(OrganizationScopedProgramMixin, viewsets.ModelViewSet):
    serializer_class = TrainingProgramAssignmentSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return TrainingProgramAssignment.objects.none()
        queryset = TrainingProgramAssignment.objects.select_related(
            "organization",
            "program",
            "customer__profile",
            "assigned_by__profile",
        ).filter(organization=organization)
        if self.request.query_params.get("include_inactive") != "true":
            queryset = queryset.filter(is_active=True)

        staff_member = self.get_request_staff_member()
        if staff_member and staff_member.role_kind == StaffMember.RoleKind.PERSONAL_TRAINER:
            queryset = queryset.filter(assigned_by=staff_member)

        program_id = self.request.query_params.get("program")
        customer_id = self.request.query_params.get("customer")
        status = self.request.query_params.get("status")
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        assignment = serializer.save()
        log_audit_event(
            self.request,
            action="training_program_assignment.created",
            target=assignment,
            summary=f"Assigned {assignment.program.title} to {assignment.customer.membership_code}",
        )

    def perform_update(self, serializer):
        assignment = serializer.save()
        log_audit_event(
            self.request,
            action="training_program_assignment.updated",
            target=assignment,
            summary=f"Updated assignment {assignment.program.title} for {assignment.customer.membership_code}",
        )

    def destroy(self, request, *args, **kwargs):
        assignment = self.get_object()
        assignment.is_active = False
        assignment.status = TrainingProgramAssignment.Status.CANCELLED
        assignment.ends_on = assignment.ends_on or timezone.localdate()
        assignment.save(update_fields=["is_active", "status", "ends_on", "updated_at"])
        log_audit_event(
            request,
            action="training_program_assignment.cancelled",
            target=assignment,
            summary=f"Cancelled assignment {assignment.program.title} for {assignment.customer.membership_code}",
        )
        return Response(self.get_serializer(assignment).data)

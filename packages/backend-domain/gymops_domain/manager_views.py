from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .admin_serializers import AdminCustomerSerializer, AdminEmployeeSerializer
from .admin_views import AdminCustomerViewSet, AdminEmployeeViewSet, OrganizationScopedAdminMixin
from .audit import log_audit_event
from .models import StaffMember, TrainingSessionOccurrence, TrainingSessionPlan
from .permissions import IsOrganizationManagerOrAdmin
from .serializers import TrainingSessionOccurrenceSerializer, TrainingSessionPlanSerializer


class OrganizationScopedManagerMixin(OrganizationScopedAdminMixin):
    permission_classes = [IsOrganizationManagerOrAdmin]


class ManagerStaffViewSet(OrganizationScopedManagerMixin, AdminEmployeeViewSet):
    serializer_class = AdminEmployeeSerializer


class ManagerTrainerViewSet(OrganizationScopedManagerMixin, AdminEmployeeViewSet):
    serializer_class = AdminEmployeeSerializer

    def get_queryset(self):
        return super().get_queryset().filter(role_kind=StaffMember.RoleKind.PERSONAL_TRAINER)

    def get_serializer(self, *args, **kwargs):
        if "data" in kwargs and isinstance(kwargs["data"], dict):
            kwargs["data"] = {**kwargs["data"], "role_kind": StaffMember.RoleKind.PERSONAL_TRAINER}
        return super().get_serializer(*args, **kwargs)


class ManagerGymGoerViewSet(OrganizationScopedManagerMixin, AdminCustomerViewSet):
    serializer_class = AdminCustomerSerializer


class GenerateSessionOccurrencesSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    start_time = serializers.TimeField()
    weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        min_length=1,
        max_length=7,
    )
    count = serializers.IntegerField(min_value=1, max_value=100, required=False)
    duration_min = serializers.IntegerField(min_value=1, max_value=1440, required=False)
    location_name = serializers.CharField(max_length=160, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class ManagerTrainingSessionPlanViewSet(OrganizationScopedManagerMixin, viewsets.ModelViewSet):
    serializer_class = TrainingSessionPlanSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return TrainingSessionPlan.objects.none()
        queryset = (
            TrainingSessionPlan.objects.select_related("organization", "customer__profile", "trainer__profile")
            .prefetch_related("occurrences")
            .filter(organization=organization)
        )
        if self.request.query_params.get("include_inactive") != "true":
            queryset = queryset.filter(is_active=True)
        trainer_id = self.request.query_params.get("trainer")
        customer_id = self.request.query_params.get("customer")
        status = self.request.query_params.get("status")
        if trainer_id:
            queryset = queryset.filter(trainer_id=trainer_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        plan = serializer.save()
        log_audit_event(
            self.request,
            action="training_session_plan.created",
            target=plan,
            summary=f"Created session plan {plan.title}",
        )

    def perform_update(self, serializer):
        plan = serializer.save()
        log_audit_event(
            self.request,
            action="training_session_plan.updated",
            target=plan,
            summary=f"Updated session plan {plan.title}",
        )

    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        plan.is_active = False
        plan.status = TrainingSessionPlan.Status.CANCELLED
        plan.save(update_fields=["is_active", "status", "updated_at"])
        log_audit_event(
            request,
            action="training_session_plan.cancelled",
            target=plan,
            summary=f"Cancelled session plan {plan.title}",
        )
        return Response(self.get_serializer(plan).data)

    @action(detail=True, methods=["post"], url_path="generate-occurrences")
    @transaction.atomic
    def generate_occurrences(self, request, pk=None):
        plan = self.get_object()
        serializer = GenerateSessionOccurrencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        existing_count = plan.occurrences.count()
        remaining_count = max(plan.total_sessions - existing_count, 0)
        requested_count = data.get("count", remaining_count)
        count = min(requested_count, remaining_count)
        if count <= 0:
            raise serializers.ValidationError({"count": "This plan has no unscheduled sessions remaining."})

        weekdays = set(data["weekdays"])
        current_date = data["start_date"]
        duration = timedelta(minutes=data.get("duration_min", plan.default_duration_min))
        created = []
        attempts = 0
        max_attempts = count * 21

        while len(created) < count and attempts < max_attempts:
            attempts += 1
            if current_date.weekday() not in weekdays:
                current_date += timedelta(days=1)
                continue

            starts_at = timezone.make_aware(datetime.combine(current_date, data["start_time"]))
            ends_at = starts_at + duration
            occurrence_data = {
                "plan": str(plan.id),
                "sequence_number": existing_count + len(created) + 1,
                "starts_at": starts_at,
                "ends_at": ends_at,
                "status": TrainingSessionOccurrence.Status.SCHEDULED,
                "location_name": data.get("location_name", ""),
                "notes": data.get("notes", ""),
            }
            occurrence_serializer = self._occurrence_serializer(data=occurrence_data)
            occurrence_serializer.is_valid(raise_exception=True)
            created.append(occurrence_serializer.save())
            current_date += timedelta(days=1)

        if len(created) < count:
            raise serializers.ValidationError({"count": "Unable to generate the requested number of sessions."})

        log_audit_event(
            request,
            action="training_session_occurrences.generated",
            target=plan,
            summary=f"Generated {len(created)} sessions for {plan.title}",
            metadata={"count": len(created)},
        )
        return Response(TrainingSessionOccurrenceSerializer(created, many=True, context=self.get_serializer_context()).data)

    def _occurrence_serializer(self, *args, **kwargs):
        kwargs.setdefault("context", self.get_serializer_context())
        return TrainingSessionOccurrenceSerializer(*args, **kwargs)


class ManagerTrainingSessionOccurrenceViewSet(OrganizationScopedManagerMixin, viewsets.ModelViewSet):
    serializer_class = TrainingSessionOccurrenceSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return TrainingSessionOccurrence.objects.none()
        queryset = TrainingSessionOccurrence.objects.select_related(
            "plan",
            "plan__organization",
            "plan__customer__profile",
            "plan__trainer__profile",
        ).filter(plan__organization=organization)
        starts_after = self.request.query_params.get("starts_after")
        starts_before = self.request.query_params.get("starts_before")
        trainer_id = self.request.query_params.get("trainer")
        customer_id = self.request.query_params.get("customer")
        if starts_after:
            queryset = queryset.filter(ends_at__gte=starts_after)
        if starts_before:
            queryset = queryset.filter(starts_at__lt=starts_before)
        if trainer_id:
            queryset = queryset.filter(plan__trainer_id=trainer_id)
        if customer_id:
            queryset = queryset.filter(plan__customer_id=customer_id)
        return queryset.order_by("starts_at")

    def perform_create(self, serializer):
        occurrence = serializer.save()
        log_audit_event(
            self.request,
            action="training_session_occurrence.created",
            target=occurrence,
            summary=f"Scheduled session {occurrence.plan.title} #{occurrence.sequence_number}",
        )

    def perform_update(self, serializer):
        occurrence = serializer.save()
        log_audit_event(
            self.request,
            action="training_session_occurrence.updated",
            target=occurrence,
            summary=f"Updated session {occurrence.plan.title} #{occurrence.sequence_number}",
        )

    def perform_destroy(self, instance):
        log_audit_event(
            self.request,
            action="training_session_occurrence.deleted",
            target=instance,
            summary=f"Deleted session {instance.plan.title} #{instance.sequence_number}",
        )
        instance.delete()

    @action(detail=False, methods=["get"])
    def calendar(self, request):
        year = int(request.query_params.get("year", timezone.now().year))
        month = int(request.query_params.get("month", timezone.now().month))
        month_start = timezone.make_aware(datetime(year, month, 1))
        if month == 12:
            month_end = timezone.make_aware(datetime(year + 1, 1, 1))
        else:
            month_end = timezone.make_aware(datetime(year, month + 1, 1))

        queryset = self.get_queryset().filter(starts_at__lt=month_end, ends_at__gte=month_start)
        return Response(self.get_serializer(queryset, many=True).data)

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.response import Response

from .admin_serializers import AdminCustomerSerializer, AdminEmployeeSerializer
from .audit import log_audit_event
from .models import Customer, StaffMember
from .permissions import IsOrganizationAdmin


class OrganizationScopedAdminMixin:
    permission_classes = [IsOrganizationAdmin]

    def get_request_organization(self):
        return getattr(getattr(self.request, "user", None), "organization", None)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_request_organization()
        return context


class AdminEmployeeViewSet(OrganizationScopedAdminMixin, viewsets.ModelViewSet):
    serializer_class = AdminEmployeeSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return StaffMember.objects.none()
        queryset = StaffMember.objects.select_related("organization", "profile").filter(
            organization=organization
        )
        if self.request.query_params.get("include_inactive") != "true":
            queryset = queryset.filter(is_active=True)
        return queryset.order_by("display_name")

    def perform_create(self, serializer):
        employee = serializer.save()
        log_audit_event(
            self.request,
            action="employee.created",
            target=employee,
            summary=f"Created employee {employee.display_name}",
        )

    def perform_update(self, serializer):
        employee = serializer.save()
        log_audit_event(
            self.request,
            action="employee.updated",
            target=employee,
            summary=f"Updated employee {employee.display_name}",
        )

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.is_active = False
        employee.employment_status = StaffMember.EmploymentStatus.TERMINATED
        employee.deactivated_at = timezone.now()
        employee.save(update_fields=["is_active", "employment_status", "deactivated_at", "updated_at"])
        log_audit_event(
            request,
            action="employee.deactivated",
            target=employee,
            summary=f"Deactivated employee {employee.display_name}",
        )
        return Response(self.get_serializer(employee).data)


class AdminCustomerViewSet(OrganizationScopedAdminMixin, viewsets.ModelViewSet):
    serializer_class = AdminCustomerSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Customer.objects.none()
        queryset = Customer.objects.select_related("organization", "profile").filter(
            organization=organization
        )
        if self.request.query_params.get("include_inactive") != "true":
            queryset = queryset.filter(is_active=True)
        return queryset.order_by("membership_code")

    def perform_create(self, serializer):
        customer = serializer.save()
        log_audit_event(
            self.request,
            action="customer.created",
            target=customer,
            summary=f"Created gym goer {customer.membership_code}",
        )

    def perform_update(self, serializer):
        customer = serializer.save()
        log_audit_event(
            self.request,
            action="customer.updated",
            target=customer,
            summary=f"Updated gym goer {customer.membership_code}",
        )

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.is_active = False
        customer.status = Customer.Status.SUSPENDED
        customer.deactivated_at = timezone.now()
        customer.save(update_fields=["is_active", "status", "deactivated_at", "updated_at"])
        log_audit_event(
            request,
            action="customer.deactivated",
            target=customer,
            summary=f"Deactivated gym goer {customer.membership_code}",
        )
        return Response(self.get_serializer(customer).data)

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import AllowAny

from .models import (
    Attachment,
    Booking,
    Customer,
    Location,
    Membership,
    Organization,
    Resource,
    Service,
    SlotInventory,
    StaffMember,
)
from .serializers import (
    AttachmentSerializer,
    BookingSerializer,
    CustomerSerializer,
    LocationSerializer,
    MembershipSerializer,
    OrganizationSerializer,
    ResourceSerializer,
    ServiceSerializer,
    SlotInventorySerializer,
    StaffMemberSerializer,
)
from .permissions import IsOrganizationManagerOrAdmin


class PublicReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]


class LegacyOrganizationScopedReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsOrganizationManagerOrAdmin]

    def get_request_organization(self):
        return getattr(getattr(self.request, "user", None), "organization", None)


class OrganizationViewSet(PublicReadOnlyViewSet):
    queryset = Organization.objects.all().order_by("name")
    serializer_class = OrganizationSerializer


class LocationViewSet(PublicReadOnlyViewSet):
    queryset = Location.objects.select_related("organization").all()
    serializer_class = LocationSerializer


class CustomerViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Customer.objects.none()
        return Customer.objects.select_related("organization", "profile").filter(organization=organization)


class StaffMemberViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = StaffMemberSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return StaffMember.objects.none()
        return StaffMember.objects.select_related("organization", "profile").filter(organization=organization)


class ResourceViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = ResourceSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Resource.objects.none()
        return Resource.objects.select_related("location", "location__organization").filter(
            location__organization=organization
        )


class ServiceViewSet(PublicReadOnlyViewSet):
    queryset = Service.objects.select_related("location").all()
    serializer_class = ServiceSerializer


class SlotInventoryViewSet(PublicReadOnlyViewSet):
    serializer_class = SlotInventorySerializer

    def get_queryset(self):
        queryset = SlotInventory.objects.select_related("service", "staff_member", "resource")
        if self.request.query_params.get("available") == "true":
            queryset = queryset.filter(is_published=True, starts_at__gt=timezone.now())
        service_id = self.request.query_params.get("service")
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        return queryset


class BookingViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = BookingSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Booking.objects.none()
        return Booking.objects.select_related("customer", "service", "slot").filter(customer__organization=organization)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        raise MethodNotAllowed("POST", detail="Legacy booking cancellation is disabled on this route.")

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        raise MethodNotAllowed("POST", detail="Legacy booking check-in is disabled on this route.")


class MembershipViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = MembershipSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Membership.objects.none()
        return Membership.objects.select_related("customer", "customer__profile", "plan").filter(
            customer__organization=organization
        )


class AttachmentViewSet(LegacyOrganizationScopedReadOnlyViewSet):
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        organization = self.get_request_organization()
        if organization is None:
            return Attachment.objects.none()
        return (
            Attachment.objects.select_related("owner_customer", "booking", "booking__customer")
            .filter(
                Q(owner_customer__organization=organization)
                | Q(booking__customer__organization=organization)
            )
            .distinct()
        )

from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
    BookingCreateSerializer,
    BookingSerializer,
    CheckInCreateSerializer,
    CheckInSerializer,
    CustomerSerializer,
    LocationSerializer,
    MembershipSerializer,
    OrganizationSerializer,
    ResourceSerializer,
    ServiceSerializer,
    SlotInventorySerializer,
    StaffMemberSerializer,
)
from .services import cancel_booking, check_in_booking, reserve_slot


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all().order_by("name")
    serializer_class = OrganizationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related("organization").all()
    serializer_class = LocationSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("organization", "profile").all()
    serializer_class = CustomerSerializer


class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.select_related("organization", "profile").all()
    serializer_class = StaffMemberSerializer


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.select_related("location").all()
    serializer_class = ResourceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related("location").all()
    serializer_class = ServiceSerializer


class SlotInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = SlotInventorySerializer

    def get_queryset(self):
        queryset = SlotInventory.objects.select_related("service", "staff_member", "resource")
        if self.request.query_params.get("available") == "true":
            queryset = queryset.filter(is_published=True, starts_at__gt=timezone.now())
        service_id = self.request.query_params.get("service")
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        return queryset


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("customer", "service", "slot").all()
    serializer_class = BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = reserve_slot(
            customer=serializer.validated_data["customer"],
            slot_id=serializer.validated_data["slot"].id,
            attendee_count=serializer.validated_data["attendee_count"],
            channel=serializer.validated_data["channel"],
            external_payment_reference=serializer.validated_data.get("external_payment_reference", ""),
        )
        return Response(BookingSerializer(booking).data, status=201)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        return Response(BookingSerializer(cancel_booking(booking=booking)).data)

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        serializer = CheckInCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        check_in = check_in_booking(
            booking=self.get_object(),
            method=serializer.validated_data["method"],
            handled_by=serializer.validated_data.get("handled_by"),
        )
        return Response(CheckInSerializer(check_in).data, status=201)


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.select_related("customer").all()
    serializer_class = MembershipSerializer


class AttachmentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Attachment.objects.select_related("owner_customer", "booking").all()
    serializer_class = AttachmentSerializer

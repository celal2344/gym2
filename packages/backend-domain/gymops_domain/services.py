from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .errors import DomainError
from .models import Booking, CheckIn, SlotInventory


@transaction.atomic
def reserve_slot(*, customer, slot_id, attendee_count: int, channel: str, external_payment_reference: str = "") -> Booking:
    slot = SlotInventory.objects.select_for_update().select_related("service").get(id=slot_id)
    if not slot.is_published or slot.starts_at <= timezone.now():
        raise DomainError("errors.booking.slot_closed")
    if slot.available_capacity < attendee_count:
        raise DomainError("errors.booking.slot_full")

    booking = Booking.objects.create(
        customer=customer,
        service=slot.service,
        slot=slot,
        attendee_count=attendee_count,
        channel=channel,
        external_payment_reference=external_payment_reference,
    )
    SlotInventory.objects.filter(id=slot.id).update(capacity_reserved=F("capacity_reserved") + attendee_count)
    return booking


@transaction.atomic
def cancel_booking(*, booking: Booking) -> Booking:
    booking = Booking.objects.select_for_update().select_related("slot").get(id=booking.id)
    if not booking.can_cancel_online():
        raise DomainError("errors.booking.cancel_window_closed")

    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.save(update_fields=["status", "cancelled_at", "updated_at"])
    SlotInventory.objects.filter(id=booking.slot_id).update(
        capacity_reserved=F("capacity_reserved") - booking.attendee_count
    )
    return booking


@transaction.atomic
def check_in_booking(*, booking: Booking, method: str, handled_by=None) -> CheckIn:
    booking = Booking.objects.select_for_update().get(id=booking.id)
    if booking.status == Booking.Status.CHECKED_IN:
        raise DomainError("errors.booking.already_checked_in")
    if booking.status != Booking.Status.RESERVED:
        raise DomainError("errors.booking.slot_closed")

    check_in = CheckIn.objects.create(booking=booking, method=method, handled_by=handled_by)
    booking.status = Booking.Status.CHECKED_IN
    booking.save(update_fields=["status", "updated_at"])
    return check_in

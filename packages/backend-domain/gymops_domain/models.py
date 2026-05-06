import uuid
from datetime import timedelta

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Organization(TimeStampedModel):
    name = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = "organizations"

    def __str__(self) -> str:
        return self.name


class Location(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="locations")
    name = models.CharField(max_length=160)
    timezone = models.CharField(max_length=64, default="Europe/Istanbul")
    address = models.TextField(blank=True)

    class Meta:
        db_table = "locations"

    def __str__(self) -> str:
        return f"{self.organization.name} - {self.name}"


class Profile(TimeStampedModel):
    supabase_user_id = models.UUIDField(unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)

    class Meta:
        db_table = "profiles"

    def __str__(self) -> str:
        return self.full_name


class Customer(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        GUEST = "guest", "Guest"
        SUSPENDED = "suspended", "Suspended"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="customers")
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name="customers")
    membership_code = models.CharField(max_length=40)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "customers"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "membership_code"], name="unique_membership_code_per_org"
            )
        ]

    def __str__(self) -> str:
        return self.membership_code


class StaffMember(TimeStampedModel):
    class RoleKind(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        PERSONAL_TRAINER = "personal_trainer", "Personal trainer"
        FRONT_DESK = "front_desk", "Front desk"
        THERAPIST = "therapist", "Therapist"

    class EmploymentStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        ON_LEAVE = "on_leave", "On leave"
        TERMINATED = "terminated", "Terminated"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="staff_members")
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name="staff_roles")
    display_name = models.CharField(max_length=160)
    role_kind = models.CharField(max_length=24, choices=RoleKind.choices)
    job_title = models.CharField(max_length=120, blank=True)
    employment_status = models.CharField(
        max_length=24, choices=EmploymentStatus.choices, default=EmploymentStatus.ACTIVE
    )
    starts_on = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=160, blank=True)
    emergency_contact_phone = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "staff_members"

    def __str__(self) -> str:
        return self.display_name


class Resource(TimeStampedModel):
    class ResourceKind(models.TextChoices):
        POOL_LANE = "pool_lane", "Pool lane"
        ROOM = "room", "Room"
        ENTRY_GATE = "entry_gate", "Entry gate"

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="resources")
    name = models.CharField(max_length=160)
    resource_kind = models.CharField(max_length=24, choices=ResourceKind.choices)
    capacity = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "resources"

    def __str__(self) -> str:
        return self.name


class Service(TimeStampedModel):
    class ServiceKind(models.TextChoices):
        POOL = "pool", "Pool"
        PERSONAL_TRAINING = "personal_training", "Personal training"
        MASSAGE = "massage", "Massage"
        DAY_PASS = "day_pass", "Day pass"

    class CapacityMode(models.TextChoices):
        SHARED_CAPACITY = "shared_capacity", "Shared capacity"
        STAFF_EXCLUSIVE = "staff_exclusive", "Staff exclusive"
        STAFF_AND_RESOURCE = "staff_and_resource", "Staff and resource"
        ENTITLEMENT = "entitlement", "Entitlement"

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=160)
    service_kind = models.CharField(max_length=32, choices=ServiceKind.choices)
    duration_min = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    slot_interval_min = models.PositiveIntegerField(default=60, validators=[MinValueValidator(1)])
    capacity_mode = models.CharField(max_length=32, choices=CapacityMode.choices)
    requires_staff = models.BooleanField(default=False)
    requires_resource = models.BooleanField(default=False)
    price_amount = models.PositiveIntegerField(default=0)
    price_currency = models.CharField(max_length=3, default="TRY")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "services"

    def __str__(self) -> str:
        return self.name


class ServiceStaff(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="eligible_staff")
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name="eligible_services")

    class Meta:
        db_table = "service_staff"
        constraints = [models.UniqueConstraint(fields=["service", "staff_member"], name="unique_service_staff")]


class AvailabilityRule(TimeStampedModel):
    class SubjectType(models.TextChoices):
        SERVICE = "service", "Service"
        STAFF = "staff", "Staff"
        RESOURCE = "resource", "Resource"

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="availability_rules")
    subject_type = models.CharField(max_length=16, choices=SubjectType.choices)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True)
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, null=True, blank=True)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True, blank=True)
    weekday = models.PositiveSmallIntegerField(validators=[MinValueValidator(0)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_blackout = models.BooleanField(default=False)

    class Meta:
        db_table = "availability_rules"


class SlotInventory(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="slots")
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name="slots")
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True, blank=True, related_name="slots")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    capacity_total = models.PositiveIntegerField(default=1)
    capacity_reserved = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        db_table = "slot_inventory"
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["service", "starts_at"]),
            models.Index(fields=["staff_member", "starts_at"]),
            models.Index(fields=["resource", "starts_at"]),
        ]

    @property
    def available_capacity(self) -> int:
        return max(self.capacity_total - self.capacity_reserved, 0)

    def can_reserve(self, attendee_count: int) -> bool:
        return self.is_published and self.starts_at > timezone.now() and self.available_capacity >= attendee_count


class Membership(TimeStampedModel):
    class ProductKind(models.TextChoices):
        MEMBERSHIP = "membership", "Membership"
        CREDIT_PACK = "credit_pack", "Credit pack"
        DAY_PASS = "day_pass", "Day pass"

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="memberships")
    product_kind = models.CharField(max_length=24, choices=ProductKind.choices)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    remaining_credits = models.PositiveIntegerField(default=0)
    external_payment_reference = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "memberships"


class TrainingSessionPlan(TimeStampedModel):
    class SessionKind(models.TextChoices):
        PERSONAL_TRAINING = "personal_training", "Personal training"
        YOGA = "yoga", "Yoga"
        SWIMMING_LESSON = "swimming_lesson", "Swimming lesson"
        BOXING = "boxing", "Boxing"
        PILATES = "pilates", "Pilates"
        REHAB = "rehab", "Rehab"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"
        EXTERNAL_PENDING = "external_pending", "External pending"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="training_session_plans")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="training_session_plans")
    trainer = models.ForeignKey(StaffMember, on_delete=models.PROTECT, related_name="training_session_plans")
    title = models.CharField(max_length=160)
    session_kind = models.CharField(max_length=32, choices=SessionKind.choices)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.ACTIVE)
    payment_status = models.CharField(
        max_length=24, choices=PaymentStatus.choices, default=PaymentStatus.EXTERNAL_PENDING
    )
    payment_amount = models.PositiveIntegerField(default=0)
    amount_paid = models.PositiveIntegerField(default=0)
    payment_currency = models.CharField(max_length=3, default="TRY")
    payment_provider = models.CharField(max_length=80, blank=True)
    external_payment_reference = models.CharField(max_length=160, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_notes = models.TextField(blank=True)
    total_sessions = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    default_duration_min = models.PositiveIntegerField(default=60, validators=[MinValueValidator(1)])
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    details = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "training_session_plans"
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["trainer", "status"]),
            models.Index(fields=["customer", "status"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ends_on__isnull=True)
                | models.Q(starts_on__isnull=True)
                | models.Q(ends_on__gte=models.F("starts_on")),
                name="training_session_plan_dates_ordered",
            ),
            models.CheckConstraint(
                condition=models.Q(amount_paid__lte=models.F("payment_amount")),
                name="training_session_amount_paid_lte_amount",
            )
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def amount_due(self) -> int:
        return max(self.payment_amount - self.amount_paid, 0)


class TrainingSessionOccurrence(TimeStampedModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No-show"
        RESCHEDULED = "rescheduled", "Rescheduled"

    plan = models.ForeignKey(TrainingSessionPlan, on_delete=models.CASCADE, related_name="occurrences")
    sequence_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.SCHEDULED)
    location_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "training_session_occurrences"
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["plan", "starts_at"]),
            models.Index(fields=["starts_at", "ends_at"]),
            models.Index(fields=["status", "starts_at"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["plan", "sequence_number"], name="unique_training_session_sequence"),
            models.CheckConstraint(
                condition=models.Q(ends_at__gt=models.F("starts_at")),
                name="training_session_ends_after_start",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.plan.title} #{self.sequence_number}"


class AuditLog(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="audit_logs")
    actor_profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    actor_staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=80)
    target_type = models.CharField(max_length=120)
    target_id = models.UUIDField(null=True, blank=True)
    summary = models.CharField(max_length=240)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "created_at"]),
            models.Index(fields=["target_type", "target_id"]),
        ]

    def __str__(self) -> str:
        return self.summary


class CreditLedger(TimeStampedModel):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name="ledger")
    booking = models.ForeignKey("Booking", on_delete=models.SET_NULL, null=True, blank=True, related_name="credit_entries")
    delta = models.IntegerField()
    reason = models.CharField(max_length=120)

    class Meta:
        db_table = "credit_ledger"


class Booking(TimeStampedModel):
    class Status(models.TextChoices):
        RESERVED = "reserved", "Reserved"
        CHECKED_IN = "checked_in", "Checked in"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No-show"

    class Channel(models.TextChoices):
        WEB = "web", "Web"
        MOBILE = "mobile", "Mobile"
        FRONT_DESK = "front_desk", "Front desk"

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="bookings")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="bookings")
    slot = models.ForeignKey(SlotInventory, on_delete=models.PROTECT, related_name="bookings")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.RESERVED)
    channel = models.CharField(max_length=24, choices=Channel.choices, default=Channel.WEB)
    attendee_count = models.PositiveIntegerField(default=1)
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True)
    external_payment_reference = models.CharField(max_length=160, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]

    def can_cancel_online(self) -> bool:
        return self.status == self.Status.RESERVED and self.slot.starts_at - timezone.now() >= timedelta(minutes=60)


class CheckIn(TimeStampedModel):
    class Method(models.TextChoices):
        QR = "qr", "QR"
        MEMBERSHIP_CODE = "membership_code", "Membership code"
        MANUAL = "manual", "Manual"

    booking = models.OneToOneField(Booking, on_delete=models.PROTECT, related_name="check_in")
    method = models.CharField(max_length=32, choices=Method.choices)
    checked_in_at = models.DateTimeField(default=timezone.now)
    handled_by = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "check_ins"


class DeviceToken(TimeStampedModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="device_tokens")
    expo_push_token = models.CharField(max_length=220)
    platform = models.CharField(max_length=24, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "device_tokens"
        constraints = [models.UniqueConstraint(fields=["customer", "expo_push_token"], name="unique_customer_device")]


class Attachment(TimeStampedModel):
    class Kind(models.TextChoices):
        RECEIPT = "receipt", "Receipt"
        WAIVER = "waiver", "Waiver"
        AVATAR = "avatar", "Avatar"
        EVIDENCE = "evidence", "Evidence"

    bucket = models.CharField(max_length=80)
    path = models.CharField(max_length=512)
    kind = models.CharField(max_length=24, choices=Kind.choices)
    owner_customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = "attachments"

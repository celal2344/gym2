from rest_framework import serializers

from .models import (
    Attachment,
    Booking,
    CheckIn,
    Customer,
    Location,
    Membership,
    Organization,
    Profile,
    Resource,
    Service,
    SlotInventory,
    StaffMember,
    TrainingProgram,
    TrainingProgramAssignment,
    TrainingSessionOccurrence,
    TrainingSessionPlan,
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "created_at", "updated_at"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "organization", "name", "timezone", "address", "created_at", "updated_at"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["id", "supabase_user_id", "full_name", "phone", "email", "created_at", "updated_at"]


class CustomerSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = ["id", "organization", "profile", "membership_code", "status", "created_at", "updated_at"]


class StaffMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffMember
        fields = ["id", "organization", "profile", "display_name", "role_kind", "is_active"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ["id", "location", "name", "resource_kind", "capacity", "is_active"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "location",
            "name",
            "service_kind",
            "duration_min",
            "slot_interval_min",
            "capacity_mode",
            "requires_staff",
            "requires_resource",
            "price_amount",
            "price_currency",
            "is_active",
        ]


class SlotInventorySerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    available_capacity = serializers.IntegerField(read_only=True)

    class Meta:
        model = SlotInventory
        fields = [
            "id",
            "service",
            "service_name",
            "staff_member",
            "resource",
            "starts_at",
            "ends_at",
            "capacity_total",
            "capacity_reserved",
            "available_capacity",
            "is_published",
        ]


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    slot_starts_at = serializers.DateTimeField(source="slot.starts_at", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "service",
            "service_name",
            "slot",
            "slot_starts_at",
            "status",
            "channel",
            "attendee_count",
            "qr_token",
            "external_payment_reference",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["service", "status", "qr_token", "cancelled_at"]


class BookingCreateSerializer(serializers.Serializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    slot = serializers.PrimaryKeyRelatedField(queryset=SlotInventory.objects.all())
    attendee_count = serializers.IntegerField(min_value=1, max_value=10, default=1)
    channel = serializers.ChoiceField(choices=Booking.Channel.choices, default=Booking.Channel.WEB)
    external_payment_reference = serializers.CharField(max_length=160, required=False, allow_blank=True)


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ["id", "booking", "method", "checked_in_at", "handled_by", "created_at"]


class CheckInCreateSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=CheckIn.Method.choices, default=CheckIn.Method.QR)
    handled_by = serializers.PrimaryKeyRelatedField(queryset=StaffMember.objects.all(), required=False, allow_null=True)


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = [
            "id",
            "customer",
            "product_kind",
            "valid_from",
            "valid_to",
            "remaining_credits",
            "external_payment_reference",
            "is_active",
        ]


class TrainingProgramSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.display_name", read_only=True)
    assignment_count = serializers.SerializerMethodField()

    class Meta:
        model = TrainingProgram
        fields = [
            "id",
            "organization",
            "title",
            "summary",
            "goal",
            "difficulty",
            "status",
            "created_by",
            "created_by_name",
            "content",
            "is_active",
            "assignment_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_by", "created_by_name", "assignment_count", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        return TrainingProgram.objects.create(
            organization=self.context["organization"],
            created_by=getattr(getattr(request, "user", None), "staff_member", None),
            **validated_data,
        )

    def get_assignment_count(self, instance) -> int:
        return instance.assignments.filter(is_active=True).count()


class TrainingProgramAssignmentSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True)
    customer_name = serializers.CharField(source="customer.profile.full_name", read_only=True)
    customer_membership_code = serializers.CharField(source="customer.membership_code", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.display_name", read_only=True)

    class Meta:
        model = TrainingProgramAssignment
        fields = [
            "id",
            "organization",
            "program",
            "program_title",
            "customer",
            "customer_name",
            "customer_membership_code",
            "assigned_by",
            "assigned_by_name",
            "status",
            "starts_on",
            "ends_on",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "program_title",
            "customer_name",
            "customer_membership_code",
            "assigned_by",
            "assigned_by_name",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        organization = self.context.get("organization")
        if organization:
            self.fields["program"].queryset = TrainingProgram.objects.filter(organization=organization, is_active=True)
            self.fields["customer"].queryset = Customer.objects.filter(organization=organization, is_active=True)

    def validate(self, attrs):
        organization = self.context.get("organization")
        program = attrs.get("program", getattr(self.instance, "program", None))
        customer = attrs.get("customer", getattr(self.instance, "customer", None))
        if organization and program and program.organization_id != organization.id:
            raise serializers.ValidationError({"program": "Program must belong to the current organization."})
        if organization and customer and customer.organization_id != organization.id:
            raise serializers.ValidationError({"customer": "Gym goer must belong to the current organization."})
        starts_on = attrs.get("starts_on", getattr(self.instance, "starts_on", None))
        ends_on = attrs.get("ends_on", getattr(self.instance, "ends_on", None))
        if starts_on and ends_on and ends_on < starts_on:
            raise serializers.ValidationError({"ends_on": "Program assignment must end after it starts."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        return TrainingProgramAssignment.objects.create(
            organization=self.context["organization"],
            assigned_by=getattr(getattr(request, "user", None), "staff_member", None),
            **validated_data,
        )


class TrainingSessionPlanSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.profile.full_name", read_only=True)
    trainer_name = serializers.CharField(source="trainer.display_name", read_only=True)
    scheduled_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSessionPlan
        fields = [
            "id",
            "organization",
            "customer",
            "customer_name",
            "trainer",
            "trainer_name",
            "title",
            "session_kind",
            "status",
            "payment_status",
            "payment_amount",
            "amount_paid",
            "amount_due",
            "payment_currency",
            "payment_provider",
            "external_payment_reference",
            "paid_at",
            "payment_notes",
            "total_sessions",
            "default_duration_min",
            "starts_on",
            "ends_on",
            "details",
            "is_active",
            "scheduled_count",
            "completed_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "amount_due",
            "scheduled_count",
            "completed_count",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        organization = self.context.get("organization")
        if organization:
            self.fields["customer"].queryset = Customer.objects.filter(organization=organization, is_active=True)
            self.fields["trainer"].queryset = StaffMember.objects.filter(
                organization=organization,
                is_active=True,
                employment_status=StaffMember.EmploymentStatus.ACTIVE,
                role_kind=StaffMember.RoleKind.PERSONAL_TRAINER,
            )

    def get_scheduled_count(self, instance) -> int:
        return instance.occurrences.count()

    def get_completed_count(self, instance) -> int:
        return instance.occurrences.filter(status=TrainingSessionOccurrence.Status.COMPLETED).count()

    def validate(self, attrs):
        organization = self.context.get("organization")
        customer = attrs.get("customer", getattr(self.instance, "customer", None))
        trainer = attrs.get("trainer", getattr(self.instance, "trainer", None))
        if organization and customer and customer.organization_id != organization.id:
            raise serializers.ValidationError({"customer": "Customer must belong to the manager organization."})
        if organization and trainer and trainer.organization_id != organization.id:
            raise serializers.ValidationError({"trainer": "Trainer must belong to the manager organization."})
        if trainer and trainer.role_kind != StaffMember.RoleKind.PERSONAL_TRAINER:
            raise serializers.ValidationError({"trainer": "Trainer must be a personal trainer staff member."})
        amount_paid = attrs.get("amount_paid", getattr(self.instance, "amount_paid", 0))
        payment_amount = attrs.get("payment_amount", getattr(self.instance, "payment_amount", 0))
        if amount_paid > payment_amount:
            raise serializers.ValidationError({"amount_paid": "Amount paid cannot exceed the payment amount."})
        return attrs

    def create(self, validated_data):
        return TrainingSessionPlan.objects.create(organization=self.context["organization"], **validated_data)


class TrainingSessionOccurrenceSerializer(serializers.ModelSerializer):
    plan_title = serializers.CharField(source="plan.title", read_only=True)
    session_kind = serializers.CharField(source="plan.session_kind", read_only=True)
    customer = serializers.UUIDField(source="plan.customer_id", read_only=True)
    customer_name = serializers.CharField(source="plan.customer.profile.full_name", read_only=True)
    trainer = serializers.UUIDField(source="plan.trainer_id", read_only=True)
    trainer_name = serializers.CharField(source="plan.trainer.display_name", read_only=True)

    class Meta:
        model = TrainingSessionOccurrence
        fields = [
            "id",
            "plan",
            "plan_title",
            "session_kind",
            "customer",
            "customer_name",
            "trainer",
            "trainer_name",
            "sequence_number",
            "starts_at",
            "ends_at",
            "status",
            "location_name",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "plan_title",
            "session_kind",
            "customer",
            "customer_name",
            "trainer",
            "trainer_name",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        organization = self.context.get("organization")
        if organization:
            self.fields["plan"].queryset = TrainingSessionPlan.objects.filter(organization=organization, is_active=True)

    def validate(self, attrs):
        organization = self.context.get("organization")
        plan = attrs.get("plan", getattr(self.instance, "plan", None))
        sequence_number = attrs.get("sequence_number", getattr(self.instance, "sequence_number", None))
        if organization and plan and plan.organization_id != organization.id:
            raise serializers.ValidationError({"plan": "Session plan must belong to the manager organization."})
        if plan and sequence_number and sequence_number > plan.total_sessions:
            raise serializers.ValidationError({"sequence_number": "Sequence cannot exceed the plan total sessions."})
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "Session must end after it starts."})
        if plan and starts_at and ends_at:
            conflict_statuses = [
                TrainingSessionOccurrence.Status.SCHEDULED,
                TrainingSessionOccurrence.Status.COMPLETED,
                TrainingSessionOccurrence.Status.RESCHEDULED,
            ]
            conflicts = TrainingSessionOccurrence.objects.select_related("plan").filter(
                status__in=conflict_statuses,
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
            )
            if self.instance:
                conflicts = conflicts.exclude(id=self.instance.id)
            trainer_conflict = conflicts.filter(plan__trainer=plan.trainer).first()
            if trainer_conflict:
                raise serializers.ValidationError(
                    {"starts_at": f"Trainer already has a session at this time: {trainer_conflict.plan.title}."}
                )
            customer_conflict = conflicts.filter(plan__customer=plan.customer).first()
            if customer_conflict:
                raise serializers.ValidationError(
                    {"starts_at": f"Gym goer already has a session at this time: {customer_conflict.plan.title}."}
                )
        return attrs


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "bucket", "path", "kind", "owner_customer", "booking", "created_at"]

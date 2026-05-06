from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Customer, Profile, StaffMember


class ProfileFieldsMixin(serializers.Serializer):
    supabase_user_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    full_name = serializers.CharField(max_length=160, write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True, write_only=True)

    def _profile_payload(self, validated_data):
        payload = {}
        for key in ["supabase_user_id", "full_name", "email", "phone"]:
            if key in validated_data:
                payload[key] = validated_data.pop(key)
        return payload

    def _upsert_profile(self, profile, payload):
        if profile is None:
            return Profile.objects.create(**payload)

        for key, value in payload.items():
            setattr(profile, key, value)
        profile.save(update_fields=[*payload.keys(), "updated_at"])
        return profile


class AdminEmployeeSerializer(ProfileFieldsMixin, serializers.ModelSerializer):
    profile_id = serializers.UUIDField(source="profile.id", read_only=True)

    class Meta:
        model = StaffMember
        fields = [
            "id",
            "profile_id",
            "supabase_user_id",
            "full_name",
            "email",
            "phone",
            "display_name",
            "role_kind",
            "job_title",
            "employment_status",
            "starts_on",
            "emergency_contact_name",
            "emergency_contact_phone",
            "notes",
            "is_active",
            "deactivated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "profile_id", "deactivated_at", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = instance.profile
        data["supabase_user_id"] = str(profile.supabase_user_id) if profile and profile.supabase_user_id else None
        data["full_name"] = profile.full_name if profile else instance.display_name
        data["email"] = profile.email if profile else ""
        data["phone"] = profile.phone if profile else ""
        return data

    @transaction.atomic
    def create(self, validated_data):
        organization = self.context["organization"]
        profile_payload = self._profile_payload(validated_data)
        profile = self._upsert_profile(None, profile_payload)
        if not validated_data.get("display_name"):
            validated_data["display_name"] = profile.full_name
        return StaffMember.objects.create(organization=organization, profile=profile, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        profile_payload = self._profile_payload(validated_data)
        if profile_payload:
            instance.profile = self._upsert_profile(instance.profile, profile_payload)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if not instance.is_active and instance.deactivated_at is None:
            instance.deactivated_at = timezone.now()
        if instance.is_active:
            instance.deactivated_at = None
        instance.save()
        return instance


class AdminCustomerSerializer(ProfileFieldsMixin, serializers.ModelSerializer):
    profile_id = serializers.UUIDField(source="profile.id", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "profile_id",
            "supabase_user_id",
            "full_name",
            "email",
            "phone",
            "membership_code",
            "status",
            "notes",
            "is_active",
            "deactivated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "profile_id", "deactivated_at", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = instance.profile
        data["supabase_user_id"] = str(profile.supabase_user_id) if profile and profile.supabase_user_id else None
        data["full_name"] = profile.full_name if profile else ""
        data["email"] = profile.email if profile else ""
        data["phone"] = profile.phone if profile else ""
        return data

    @transaction.atomic
    def create(self, validated_data):
        organization = self.context["organization"]
        profile_payload = self._profile_payload(validated_data)
        profile = self._upsert_profile(None, profile_payload)
        return Customer.objects.create(organization=organization, profile=profile, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        profile_payload = self._profile_payload(validated_data)
        if profile_payload:
            instance.profile = self._upsert_profile(instance.profile, profile_payload)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if not instance.is_active and instance.deactivated_at is None:
            instance.deactivated_at = timezone.now()
        if instance.is_active:
            instance.deactivated_at = None
        instance.save()
        return instance

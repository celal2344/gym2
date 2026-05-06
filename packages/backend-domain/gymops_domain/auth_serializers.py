from rest_framework import serializers


class AuthMeSerializer(serializers.Serializer):
    def to_representation(self, identity):
        profile = identity.profile
        organization = identity.organization
        staff_member = identity.staff_member
        customer = identity.customer

        return {
            "profile": {
                "id": str(profile.id),
                "supabase_user_id": str(profile.supabase_user_id) if profile.supabase_user_id else None,
                "full_name": profile.full_name,
                "email": profile.email,
                "phone": profile.phone,
            },
            "organization": {
                "id": str(organization.id),
                "name": organization.name,
                "slug": organization.slug,
            }
            if organization
            else None,
            "role": identity.role,
            "staff_member": {
                "id": str(staff_member.id),
                "display_name": staff_member.display_name,
                "role_kind": staff_member.role_kind,
                "job_title": staff_member.job_title,
            }
            if staff_member
            else None,
            "customer": {
                "id": str(customer.id),
                "membership_code": customer.membership_code,
                "status": customer.status,
            }
            if customer
            else None,
            "allowed_panels": self._allowed_panels(identity.role),
        }

    def _allowed_panels(self, role):
        if role == "admin":
            return ["admin", "manager", "profile"]
        if role == "manager":
            return ["manager", "profile"]
        if role == "personal_trainer":
            return ["trainer", "profile"]
        if role == "user":
            return ["app", "profile"]
        return ["profile"]

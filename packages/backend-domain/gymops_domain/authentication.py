from dataclasses import dataclass
from uuid import UUID

import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Customer, Profile, StaffMember


@dataclass(frozen=True)
class RequestIdentity:
    profile: Profile
    staff_member: StaffMember | None = None
    customer: Customer | None = None

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def organization(self):
        if self.staff_member:
            return self.staff_member.organization
        if self.customer:
            return self.customer.organization
        return None

    @property
    def role(self) -> str:
        if self.staff_member:
            return self.staff_member.role_kind
        if self.customer:
            return "user"
        return "anonymous"


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request):
        return self.keyword

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).decode("utf-8")
        if not auth:
            return None

        parts = auth.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed("Invalid authorization header.")

        secret = getattr(settings, "SUPABASE_JWT_SECRET", "")
        if not secret:
            raise AuthenticationFailed("Supabase JWT verification is not configured.")

        try:
            payload = jwt.decode(parts[1], secret, algorithms=["HS256"], options={"verify_aud": False})
            supabase_user_id = UUID(payload["sub"])
        except Exception as exc:
            raise AuthenticationFailed("Invalid Supabase token.") from exc

        try:
            profile = Profile.objects.get(supabase_user_id=supabase_user_id)
        except Profile.DoesNotExist as exc:
            raise AuthenticationFailed("No profile is linked to this Supabase user.") from exc

        staff_member = (
            StaffMember.objects.select_related("organization", "profile")
            .filter(profile=profile, is_active=True, employment_status=StaffMember.EmploymentStatus.ACTIVE)
            .first()
        )
        customer = (
            Customer.objects.select_related("organization", "profile")
            .filter(profile=profile, is_active=True, status=Customer.Status.ACTIVE)
            .first()
        )

        return RequestIdentity(profile=profile, staff_member=staff_member, customer=customer), payload

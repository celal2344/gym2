from rest_framework.permissions import BasePermission

from .models import StaffMember


class IsAuthenticatedProfile(BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request, "user", None) and request.user.is_authenticated)


class IsOrganizationAdmin(IsAuthenticatedProfile):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.staff_member is not None
            and request.user.staff_member.role_kind == StaffMember.RoleKind.ADMIN
            and request.user.staff_member.is_active
        )


class IsOrganizationManagerOrAdmin(IsAuthenticatedProfile):
    allowed_roles = {StaffMember.RoleKind.ADMIN, StaffMember.RoleKind.MANAGER}

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.staff_member is not None
            and request.user.staff_member.role_kind in self.allowed_roles
            and request.user.staff_member.is_active
        )


class IsProgramAssigner(IsAuthenticatedProfile):
    allowed_roles = {
        StaffMember.RoleKind.ADMIN,
        StaffMember.RoleKind.MANAGER,
        StaffMember.RoleKind.PERSONAL_TRAINER,
    }

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.staff_member is not None
            and request.user.staff_member.role_kind in self.allowed_roles
            and request.user.staff_member.is_active
        )

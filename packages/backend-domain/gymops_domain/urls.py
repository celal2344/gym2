from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminCustomerViewSet, AdminEmployeeViewSet
from .auth_views import AuthMeView
from .manager_views import (
    ManagerGymGoerViewSet,
    ManagerMemberCheckInViewSet,
    ManagerMembershipPlanViewSet,
    ManagerMembershipViewSet,
    ManagerStaffViewSet,
    ManagerTrainerViewSet,
    ManagerTrainingSessionOccurrenceViewSet,
    ManagerTrainingSessionPlanViewSet,
)
from .program_views import TrainingProgramAssignmentViewSet, TrainingProgramViewSet
from .views import (
    AttachmentViewSet,
    BookingViewSet,
    CustomerViewSet,
    LocationViewSet,
    MembershipViewSet,
    OrganizationViewSet,
    ResourceViewSet,
    ServiceViewSet,
    SlotInventoryViewSet,
    StaffMemberViewSet,
)

router = DefaultRouter()
router.register("organizations", OrganizationViewSet)
router.register("locations", LocationViewSet)
router.register("customers", CustomerViewSet)
router.register("staff", StaffMemberViewSet)
router.register("resources", ResourceViewSet)
router.register("services", ServiceViewSet)
router.register("slots", SlotInventoryViewSet, basename="slots")
router.register("bookings", BookingViewSet)
router.register("memberships", MembershipViewSet)
router.register("attachments", AttachmentViewSet)
router.register("programs", TrainingProgramViewSet, basename="programs")
router.register("program-assignments", TrainingProgramAssignmentViewSet, basename="program-assignments")
router.register("admin/employees", AdminEmployeeViewSet, basename="admin-employees")
router.register("admin/customers", AdminCustomerViewSet, basename="admin-customers")
router.register("manager/staff", ManagerStaffViewSet, basename="manager-staff")
router.register("manager/trainers", ManagerTrainerViewSet, basename="manager-trainers")
router.register("manager/gym-goers", ManagerGymGoerViewSet, basename="manager-gym-goers")
router.register("manager/membership-plans", ManagerMembershipPlanViewSet, basename="manager-membership-plans")
router.register("manager/memberships", ManagerMembershipViewSet, basename="manager-memberships")
router.register("manager/check-ins", ManagerMemberCheckInViewSet, basename="manager-check-ins")
router.register("manager/session-plans", ManagerTrainingSessionPlanViewSet, basename="manager-session-plans")
router.register(
    "manager/session-occurrences",
    ManagerTrainingSessionOccurrenceViewSet,
    basename="manager-session-occurrences",
)

urlpatterns = [
    path("auth/me/", AuthMeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
]

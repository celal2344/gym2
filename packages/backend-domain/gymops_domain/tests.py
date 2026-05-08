from copy import deepcopy
from datetime import timedelta
from uuid import uuid4

import jwt
from django.conf import settings
from django.test import override_settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
    Booking,
    Customer,
    Location,
    Organization,
    Profile,
    Service,
    SlotInventory,
    StaffMember,
    TrainingProgram,
    TrainingProgramAssignment,
    TrainingSessionOccurrence,
    TrainingSessionPlan,
)
from .services import cancel_booking, check_in_booking, reserve_slot


class ReservationServiceTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Fit Club", slug="fit-club")
        self.location = Location.objects.create(organization=self.organization, name="Main")
        self.profile = Profile.objects.create(full_name="Aylin Demir", email="aylin@example.com")
        self.customer = Customer.objects.create(
            organization=self.organization,
            profile=self.profile,
            membership_code="M-1001",
        )
        self.service = Service.objects.create(
            location=self.location,
            name="Pool",
            service_kind=Service.ServiceKind.POOL,
            duration_min=60,
            capacity_mode=Service.CapacityMode.SHARED_CAPACITY,
        )
        self.slot = SlotInventory.objects.create(
            service=self.service,
            starts_at=timezone.now() + timedelta(hours=4),
            ends_at=timezone.now() + timedelta(hours=5),
            capacity_total=2,
        )

    def test_reserve_slot_consumes_capacity(self):
        booking = reserve_slot(customer=self.customer, slot_id=self.slot.id, attendee_count=2, channel=Booking.Channel.WEB)

        self.slot.refresh_from_db()
        self.assertEqual(booking.service, self.service)
        self.assertEqual(self.slot.capacity_reserved, 2)

    def test_full_slot_returns_localized_error_from_api(self):
        reserve_slot(customer=self.customer, slot_id=self.slot.id, attendee_count=2, channel=Booking.Channel.WEB)

        client = APIClient()
        response = client.post(
            reverse("booking-list"),
            {
                "customer": str(self.customer.id),
                "slot": str(self.slot.id),
                "attendee_count": 1,
                "channel": Booking.Channel.WEB,
            },
            format="json",
            HTTP_ACCEPT_LANGUAGE="tr",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "errors.booking.slot_full")
        self.assertEqual(response.data["message"], "Bu slot dolu.")

    def test_cancel_booking_releases_capacity(self):
        booking = reserve_slot(customer=self.customer, slot_id=self.slot.id, attendee_count=1, channel=Booking.Channel.WEB)

        cancel_booking(booking=booking)

        booking.refresh_from_db()
        self.slot.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELLED)
        self.assertEqual(self.slot.capacity_reserved, 0)

    def test_duplicate_check_in_is_rejected(self):
        booking = reserve_slot(customer=self.customer, slot_id=self.slot.id, attendee_count=1, channel=Booking.Channel.WEB)
        check_in_booking(booking=booking, method="qr")

        client = APIClient()
        response = client.post(reverse("booking-check-in", args=[booking.id]), {"method": "qr"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "errors.booking.already_checked_in")


@override_settings(SUPABASE_JWT_SECRET="test-secret-with-at-least-32-bytes")
class AdminAuthorizationTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Fit Club", slug="fit-club")
        self.other_organization = Organization.objects.create(name="Other Club", slug="other-club")
        self.admin_user_id = uuid4()
        self.manager_user_id = uuid4()
        self.admin_profile = Profile.objects.create(
            supabase_user_id=self.admin_user_id,
            full_name="Admin User",
            email="admin@example.com",
        )
        self.manager_profile = Profile.objects.create(
            supabase_user_id=self.manager_user_id,
            full_name="Manager User",
            email="manager@example.com",
        )
        self.admin_staff = StaffMember.objects.create(
            organization=self.organization,
            profile=self.admin_profile,
            display_name="Admin User",
            role_kind=StaffMember.RoleKind.ADMIN,
        )
        StaffMember.objects.create(
            organization=self.organization,
            profile=self.manager_profile,
            display_name="Manager User",
            role_kind=StaffMember.RoleKind.MANAGER,
        )
        self.client = APIClient()

    def token_for(self, user_id):
        return jwt.encode({"sub": str(user_id)}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def authenticate_as_admin(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_for(self.admin_user_id)}")

    def authenticate_as_manager(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_for(self.manager_user_id)}")

    def valid_program_content(self):
        return {
            "version": 1,
            "source_attribution": "Free Exercise DB optional visual cue links.",
            "weeks": [
                {
                    "id": "week-1",
                    "title": "Week 1",
                    "days": [
                        {
                            "id": "day-1",
                            "title": "Day 1",
                            "focus": "Strength",
                            "exercises": [
                                {
                                    "id": "exercise-1",
                                    "exercise_name": "Goblet squat",
                                    "target_muscles": "legs, core",
                                    "equipment": "dumbbell",
                                    "sets": 3,
                                    "reps": "8-10",
                                    "rest_seconds": 75,
                                    "notes": "",
                                    "visual_cue": {
                                        "setup": "Feet shoulder-width, weight close to the chest.",
                                        "action": "Sit between the hips, then drive the floor away.",
                                        "tempo": "Controlled down, strong up.",
                                        "breathing": "Inhale before lowering, exhale after standing.",
                                        "safety": "Keep knees tracking over toes.",
                                        "image_url": "",
                                        "source_name": "Free Exercise DB",
                                        "source_url": "https://github.com/yuhonas/free-exercise-db",
                                    },
                                }
                            ],
                        }
                    ],
                }
            ],
        }

    def test_admin_can_create_list_update_and_deactivate_employee(self):
        self.authenticate_as_admin()

        create_response = self.client.post(
            reverse("admin-employees-list"),
            {
                "supabase_user_id": str(uuid4()),
                "full_name": "Trainer One",
                "email": "trainer@example.com",
                "phone": "+905551112233",
                "display_name": "Trainer One",
                "role_kind": StaffMember.RoleKind.PERSONAL_TRAINER,
                "job_title": "Strength coach",
                "employment_status": StaffMember.EmploymentStatus.ACTIVE,
                "starts_on": "2026-05-05",
                "emergency_contact_name": "Contact Person",
                "emergency_contact_phone": "+905554445566",
                "notes": "Morning program owner",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)

        employee_id = create_response.data["id"]
        list_response = self.client.get(reverse("admin-employees-list"))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 3)

        patch_response = self.client.patch(
            reverse("admin-employees-detail", args=[employee_id]),
            {"job_title": "Senior strength coach"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["job_title"], "Senior strength coach")

        delete_response = self.client.delete(reverse("admin-employees-detail", args=[employee_id]))
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(delete_response.data["is_active"])

    def test_authenticated_user_can_read_own_profile_context(self):
        self.authenticate_as_admin()

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["email"], "admin@example.com")
        self.assertEqual(response.data["role"], StaffMember.RoleKind.ADMIN)
        self.assertEqual(response.data["organization"]["slug"], "fit-club")
        self.assertIn("admin", response.data["allowed_panels"])

    def test_admin_can_manage_customers_within_own_organization(self):
        self.authenticate_as_admin()

        create_response = self.client.post(
            reverse("admin-customers-list"),
            {
                "supabase_user_id": str(uuid4()),
                "full_name": "Customer One",
                "email": "customer@example.com",
                "phone": "+905550000000",
                "membership_code": "M-2001",
                "status": Customer.Status.ACTIVE,
                "notes": "Prefers evening slots",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)

        customer_id = create_response.data["id"]
        patch_response = self.client.patch(
            reverse("admin-customers-detail", args=[customer_id]),
            {"notes": "Updated note"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["notes"], "Updated note")

        delete_response = self.client.delete(reverse("admin-customers-detail", args=[customer_id]))
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(delete_response.data["is_active"])
        self.assertEqual(delete_response.data["status"], Customer.Status.SUSPENDED)

    def test_manager_cannot_access_admin_endpoints(self):
        self.authenticate_as_manager()

        response = self.client.get(reverse("admin-employees-list"))

        self.assertEqual(response.status_code, 403)

    def test_manager_can_manage_staff_trainers_and_gym_goers(self):
        self.authenticate_as_manager()

        staff_response = self.client.post(
            reverse("manager-staff-list"),
            {
                "full_name": "Front Desk One",
                "email": "front@example.com",
                "phone": "+905551110000",
                "display_name": "Front Desk One",
                "role_kind": StaffMember.RoleKind.FRONT_DESK,
                "job_title": "Reception",
                "employment_status": StaffMember.EmploymentStatus.ACTIVE,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(staff_response.status_code, 201)
        self.assertEqual(staff_response.data["role_kind"], StaffMember.RoleKind.FRONT_DESK)

        trainer_response = self.client.post(
            reverse("manager-trainers-list"),
            {
                "full_name": "Trainer Manager Created",
                "email": "trainer-manager@example.com",
                "phone": "+905552220000",
                "display_name": "Trainer Manager Created",
                "role_kind": StaffMember.RoleKind.MANAGER,
                "job_title": "Conditioning coach",
                "employment_status": StaffMember.EmploymentStatus.ACTIVE,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(trainer_response.status_code, 201)
        self.assertEqual(trainer_response.data["role_kind"], StaffMember.RoleKind.PERSONAL_TRAINER)

        customer_response = self.client.post(
            reverse("manager-gym-goers-list"),
            {
                "full_name": "Gym Goer One",
                "email": "goer@example.com",
                "phone": "+905553330000",
                "membership_code": "M-3001",
                "status": Customer.Status.ACTIVE,
                "notes": "Manager-created",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(customer_response.status_code, 201)

        patch_response = self.client.patch(
            reverse("manager-gym-goers-detail", args=[customer_response.data["id"]]),
            {"notes": "Updated by manager"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["notes"], "Updated by manager")

        delete_response = self.client.delete(reverse("manager-trainers-detail", args=[trainer_response.data["id"]]))
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(delete_response.data["is_active"])

    def test_manager_cannot_access_other_organization_staff(self):
        self.authenticate_as_manager()
        other_profile = Profile.objects.create(full_name="Other Staff", email="other-staff@example.com")
        other_staff = StaffMember.objects.create(
            organization=self.other_organization,
            profile=other_profile,
            display_name="Other Staff",
            role_kind=StaffMember.RoleKind.PERSONAL_TRAINER,
        )

        response = self.client.get(reverse("manager-staff-detail", args=[other_staff.id]))

        self.assertEqual(response.status_code, 404)

    def test_manager_can_manage_training_session_plan_and_calendar(self):
        self.authenticate_as_manager()
        trainer_profile = Profile.objects.create(full_name="Trainer Calendar", email="trainer-calendar@example.com")
        trainer = StaffMember.objects.create(
            organization=self.organization,
            profile=trainer_profile,
            display_name="Trainer Calendar",
            role_kind=StaffMember.RoleKind.PERSONAL_TRAINER,
        )
        customer_profile = Profile.objects.create(full_name="Gym Goer Calendar", email="goer-calendar@example.com")
        customer = Customer.objects.create(
            organization=self.organization,
            profile=customer_profile,
            membership_code="M-CALENDAR",
        )

        plan_response = self.client.post(
            reverse("manager-session-plans-list"),
            {
                "customer": str(customer.id),
                "trainer": str(trainer.id),
                "title": "Boxing fundamentals",
                "session_kind": TrainingSessionPlan.SessionKind.BOXING,
                "status": TrainingSessionPlan.Status.ACTIVE,
                "payment_status": TrainingSessionPlan.PaymentStatus.PARTIAL,
                "payment_amount": 120000,
                "payment_currency": "TRY",
                "external_payment_reference": "pay_ext_123",
                "total_sessions": 8,
                "default_duration_min": 60,
                "starts_on": "2026-05-06",
                "ends_on": "2026-06-24",
                "details": "Twice weekly boxing sessions",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(plan_response.status_code, 201)
        self.assertEqual(plan_response.data["payment_status"], TrainingSessionPlan.PaymentStatus.PARTIAL)

        occurrence_response = self.client.post(
            reverse("manager-session-occurrences-list"),
            {
                "plan": plan_response.data["id"],
                "sequence_number": 1,
                "starts_at": "2026-05-06T09:00:00Z",
                "ends_at": "2026-05-06T10:00:00Z",
                "status": TrainingSessionOccurrence.Status.SCHEDULED,
                "location_name": "Studio A",
                "notes": "Wraps and stance",
            },
            format="json",
        )
        self.assertEqual(occurrence_response.status_code, 201)
        self.assertEqual(occurrence_response.data["trainer_name"], "Trainer Calendar")
        self.assertEqual(occurrence_response.data["customer_name"], "Gym Goer Calendar")

        calendar_response = self.client.get(reverse("manager-session-occurrences-calendar"), {"year": 2026, "month": 5})
        self.assertEqual(calendar_response.status_code, 200)
        self.assertEqual(len(calendar_response.data), 1)
        self.assertEqual(calendar_response.data[0]["plan_title"], "Boxing fundamentals")

    def test_manager_can_edit_and_assign_program_shell(self):
        self.authenticate_as_manager()
        customer_profile = Profile.objects.create(full_name="Program Member", email="program-member@example.com")
        customer = Customer.objects.create(
            organization=self.organization,
            profile=customer_profile,
            membership_code="M-PROGRAM",
        )

        program_response = self.client.post(
            reverse("programs-list"),
            {
                "title": "Strength foundation",
                "summary": "",
                "goal": "Build baseline strength",
                "difficulty": "beginner",
                "status": TrainingProgram.Status.DRAFT,
                "content": self.valid_program_content(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(program_response.status_code, 201)
        self.assertEqual(program_response.data["content"]["weeks"][0]["days"][0]["exercises"][0]["sets"], 3)

        patch_response = self.client.patch(
            reverse("programs-detail", args=[program_response.data["id"]]),
            {"status": TrainingProgram.Status.ACTIVE},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["status"], TrainingProgram.Status.ACTIVE)

        assignment_response = self.client.post(
            reverse("program-assignments-list"),
            {
                "program": program_response.data["id"],
                "customer": str(customer.id),
                "status": TrainingProgramAssignment.Status.ASSIGNED,
                "starts_on": "2026-05-08",
                "notes": "Start next week",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(assignment_response.status_code, 201)
        self.assertEqual(assignment_response.data["program_title"], "Strength foundation")
        self.assertEqual(assignment_response.data["customer_membership_code"], "M-PROGRAM")

    def test_manager_program_content_validation_rejects_invalid_exercise_payload(self):
        self.authenticate_as_manager()
        invalid_content = deepcopy(self.valid_program_content())
        invalid_content["weeks"][0]["days"][0]["exercises"][0]["sets"] = 0

        response = self.client.post(
            reverse("programs-list"),
            {
                "title": "Invalid strength plan",
                "summary": "",
                "goal": "Build baseline strength",
                "difficulty": "beginner",
                "status": TrainingProgram.Status.DRAFT,
                "content": invalid_content,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("content", response.data["details"])

    def test_manager_session_plan_rejects_other_organization_customer(self):
        self.authenticate_as_manager()
        trainer_profile = Profile.objects.create(full_name="Trainer Same Org", email="same-trainer@example.com")
        trainer = StaffMember.objects.create(
            organization=self.organization,
            profile=trainer_profile,
            display_name="Trainer Same Org",
            role_kind=StaffMember.RoleKind.PERSONAL_TRAINER,
        )
        other_profile = Profile.objects.create(full_name="Other Customer", email="other-customer@example.com")
        other_customer = Customer.objects.create(
            organization=self.other_organization,
            profile=other_profile,
            membership_code="OTHER-CUSTOMER",
        )

        response = self.client.post(
            reverse("manager-session-plans-list"),
            {
                "customer": str(other_customer.id),
                "trainer": str(trainer.id),
                "title": "Invalid cross organization",
                "session_kind": TrainingSessionPlan.SessionKind.YOGA,
                "payment_status": TrainingSessionPlan.PaymentStatus.EXTERNAL_PENDING,
                "total_sessions": 4,
                "default_duration_min": 45,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_admin_cannot_access_other_organization_employee(self):
        self.authenticate_as_admin()
        other_profile = Profile.objects.create(full_name="Other Trainer", email="other@example.com")
        other_employee = StaffMember.objects.create(
            organization=self.other_organization,
            profile=other_profile,
            display_name="Other Trainer",
            role_kind=StaffMember.RoleKind.PERSONAL_TRAINER,
        )

        response = self.client.get(reverse("admin-employees-detail", args=[other_employee.id]))

        self.assertEqual(response.status_code, 404)

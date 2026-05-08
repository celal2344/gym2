from uuid import UUID
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from gymops_domain.models import (
    Customer,
    Location,
    Organization,
    Profile,
    StaffMember,
    TrainingProgram,
    TrainingProgramAssignment,
    TrainingSessionOccurrence,
    TrainingSessionPlan,
)


SAMPLE_USERS = [
    {
        "id": UUID("10000000-0000-4000-8000-000000000001"),
        "email": "admin@gymops.dev",
        "full_name": "Admin User",
        "phone": "+905550000001",
        "staff_role": StaffMember.RoleKind.ADMIN,
        "job_title": "Organization admin",
    },
    {
        "id": UUID("10000000-0000-4000-8000-000000000002"),
        "email": "manager@gymops.dev",
        "full_name": "Manager User",
        "phone": "+905550000002",
        "staff_role": StaffMember.RoleKind.MANAGER,
        "job_title": "Operations manager",
    },
    {
        "id": UUID("10000000-0000-4000-8000-000000000003"),
        "email": "trainer@gymops.dev",
        "full_name": "Trainer User",
        "phone": "+905550000003",
        "staff_role": StaffMember.RoleKind.PERSONAL_TRAINER,
        "job_title": "Personal trainer",
    },
    {
        "id": UUID("10000000-0000-4000-8000-000000000004"),
        "email": "member@gymops.dev",
        "full_name": "Member User",
        "phone": "+905550000004",
        "membership_code": "M-SAMPLE-001",
    },
]


class Command(BaseCommand):
    help = "Seed sample organization users that match the Supabase local seed credentials."

    def handle(self, *args, **options):
        organization, _ = Organization.objects.update_or_create(
            slug="fit-club",
            defaults={"name": "Fit Club"},
        )
        Location.objects.update_or_create(
            organization=organization,
            name="Main",
            defaults={"timezone": "Europe/Istanbul", "address": "Sample gym location"},
        )

        for user in SAMPLE_USERS:
            profile, _ = Profile.objects.update_or_create(
                supabase_user_id=user["id"],
                defaults={
                    "full_name": user["full_name"],
                    "email": user["email"],
                    "phone": user["phone"],
                },
            )

            if staff_role := user.get("staff_role"):
                StaffMember.objects.update_or_create(
                    organization=organization,
                    profile=profile,
                    defaults={
                        "display_name": user["full_name"],
                        "role_kind": staff_role,
                        "job_title": user["job_title"],
                        "employment_status": StaffMember.EmploymentStatus.ACTIVE,
                        "is_active": True,
                    },
                )

            if membership_code := user.get("membership_code"):
                Customer.objects.update_or_create(
                    organization=organization,
                    membership_code=membership_code,
                    defaults={
                        "profile": profile,
                        "status": Customer.Status.ACTIVE,
                        "is_active": True,
                    },
                )

        trainer = StaffMember.objects.get(
            organization=organization,
            profile__supabase_user_id=UUID("10000000-0000-4000-8000-000000000003"),
        )
        customer = Customer.objects.get(organization=organization, membership_code="M-SAMPLE-001")
        plan, _ = TrainingSessionPlan.objects.update_or_create(
            organization=organization,
            customer=customer,
            trainer=trainer,
            title="Sample boxing fundamentals",
            defaults={
                "session_kind": TrainingSessionPlan.SessionKind.BOXING,
                "status": TrainingSessionPlan.Status.ACTIVE,
                "payment_status": TrainingSessionPlan.PaymentStatus.PARTIAL,
                "payment_amount": 120000,
                "amount_paid": 60000,
                "payment_currency": "TRY",
                "payment_provider": "external",
                "external_payment_reference": "sample-payment-reference",
                "total_sessions": 8,
                "default_duration_min": 60,
                "starts_on": datetime(2026, 5, 6).date(),
                "ends_on": datetime(2026, 6, 24).date(),
                "details": "Sample trainer-led boxing package seeded for manager calendar testing.",
                "is_active": True,
            },
        )
        first_session = timezone.make_aware(datetime(2026, 5, 6, 9, 0))
        for index in range(4):
            starts_at = first_session + timedelta(days=index * 7)
            TrainingSessionOccurrence.objects.update_or_create(
                plan=plan,
                sequence_number=index + 1,
                defaults={
                    "starts_at": starts_at,
                    "ends_at": starts_at + timedelta(minutes=60),
                    "status": TrainingSessionOccurrence.Status.SCHEDULED,
                    "location_name": "Studio A",
                    "notes": "Sample seeded session",
                },
            )

        program, _ = TrainingProgram.objects.update_or_create(
            organization=organization,
            title="Sample strength foundation",
            defaults={
                "summary": "Blank shell for a future detailed strength program builder.",
                "goal": "Strength foundation",
                "difficulty": "beginner",
                "status": TrainingProgram.Status.ACTIVE,
                "created_by": trainer,
                "content": {},
                "is_active": True,
            },
        )
        TrainingProgramAssignment.objects.update_or_create(
            organization=organization,
            program=program,
            customer=customer,
            defaults={
                "assigned_by": trainer,
                "status": TrainingProgramAssignment.Status.ACTIVE,
                "starts_on": datetime(2026, 5, 6).date(),
                "ends_on": datetime(2026, 6, 24).date(),
                "notes": "Sample assignment for the program listing workflow.",
                "is_active": True,
            },
        )

        self.stdout.write(self.style.SUCCESS("Seeded GymOps sample users."))

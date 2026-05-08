import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0005_trainingsessionplan_training_session_amount_paid_lte_amount"),
    ]

    operations = [
        migrations.CreateModel(
            name="TrainingProgram",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=160)),
                ("summary", models.TextField(blank=True)),
                ("goal", models.CharField(blank=True, max_length=160)),
                ("difficulty", models.CharField(blank=True, max_length=80)),
                (
                    "status",
                    models.CharField(
                        choices=[("draft", "Draft"), ("active", "Active"), ("archived", "Archived")],
                        default="draft",
                        max_length=24,
                    ),
                ),
                ("content", models.JSONField(blank=True, default=dict)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_training_programs",
                        to="reservations.staffmember",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="training_programs",
                        to="reservations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "training_programs",
                "ordering": ["title"],
            },
        ),
        migrations.CreateModel(
            name="TrainingProgramAssignment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("assigned", "Assigned"),
                            ("active", "Active"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="assigned",
                        max_length=24,
                    ),
                ),
                ("starts_on", models.DateField(blank=True, null=True)),
                ("ends_on", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "assigned_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assigned_training_programs",
                        to="reservations.staffmember",
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="training_program_assignments",
                        to="reservations.customer",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="training_program_assignments",
                        to="reservations.organization",
                    ),
                ),
                (
                    "program",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="assignments",
                        to="reservations.trainingprogram",
                    ),
                ),
            ],
            options={
                "db_table": "training_program_assignments",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="trainingprogram",
            index=models.Index(fields=["organization", "status"], name="training_pr_organiz_d6bc41_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingprogram",
            index=models.Index(fields=["organization", "is_active"], name="training_pr_organiz_a8c1a6_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingprogramassignment",
            index=models.Index(fields=["organization", "status"], name="training_pr_organiz_a2b705_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingprogramassignment",
            index=models.Index(fields=["customer", "status"], name="training_pr_customer_8f9fa1_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingprogramassignment",
            index=models.Index(fields=["assigned_by", "status"], name="training_pr_assigne_318915_idx"),
        ),
        migrations.AddConstraint(
            model_name="trainingprogramassignment",
            constraint=models.CheckConstraint(
                condition=models.Q(ends_on__isnull=True)
                | models.Q(starts_on__isnull=True)
                | models.Q(ends_on__gte=models.F("starts_on")),
                name="training_program_assignment_dates_ordered",
            ),
        ),
    ]

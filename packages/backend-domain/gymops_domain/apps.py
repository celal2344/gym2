from django.apps import AppConfig


class ReservationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "gymops_domain"
    label = "reservations"

    def ready(self):
        import gymops_domain.schema  # noqa: F401

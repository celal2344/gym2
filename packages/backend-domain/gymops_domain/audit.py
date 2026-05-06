from .models import AuditLog


def log_audit_event(request, *, action, target, summary, metadata=None):
    identity = getattr(request, "user", None)
    organization = getattr(identity, "organization", None)
    if organization is None:
        return None

    return AuditLog.objects.create(
        organization=organization,
        actor_profile=getattr(identity, "profile", None),
        actor_staff_member=getattr(identity, "staff_member", None),
        action=action,
        target_type=target.__class__.__name__,
        target_id=getattr(target, "id", None),
        summary=summary,
        metadata=metadata or {},
    )

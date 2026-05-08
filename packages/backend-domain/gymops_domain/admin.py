from django.contrib import admin

from .models import (
    Attachment,
    AvailabilityRule,
    AuditLog,
    Booking,
    CheckIn,
    CreditLedger,
    Customer,
    DeviceToken,
    Location,
    MemberCheckIn,
    Membership,
    MembershipPlan,
    Organization,
    Profile,
    Resource,
    Service,
    ServiceStaff,
    SlotInventory,
    StaffMember,
    TrainingSessionOccurrence,
    TrainingSessionPlan,
)

admin.site.register(Organization)
admin.site.register(Location)
admin.site.register(Profile)
admin.site.register(Customer)
admin.site.register(StaffMember)
admin.site.register(Resource)
admin.site.register(Service)
admin.site.register(ServiceStaff)
admin.site.register(AvailabilityRule)
admin.site.register(SlotInventory)
admin.site.register(MembershipPlan)
admin.site.register(Membership)
admin.site.register(TrainingSessionPlan)
admin.site.register(TrainingSessionOccurrence)
admin.site.register(CreditLedger)
admin.site.register(Booking)
admin.site.register(CheckIn)
admin.site.register(MemberCheckIn)
admin.site.register(DeviceToken)
admin.site.register(Attachment)
admin.site.register(AuditLog)

# Register your models here.

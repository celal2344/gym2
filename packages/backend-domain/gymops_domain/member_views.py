from rest_framework import viewsets

from .models import TrainingProgramAssignment
from .permissions import IsActiveCustomer
from .serializers import MemberTrainingProgramAssignmentSerializer


class MemberProgramAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsActiveCustomer]
    serializer_class = MemberTrainingProgramAssignmentSerializer

    def get_queryset(self):
        customer = getattr(self.request.user, "customer", None)
        if customer is None:
            return TrainingProgramAssignment.objects.none()
        queryset = TrainingProgramAssignment.objects.select_related("program", "assigned_by").filter(
            customer=customer,
            is_active=True,
        )
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by("-created_at")

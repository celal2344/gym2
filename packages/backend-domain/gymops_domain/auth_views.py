from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from .auth_serializers import AuthMeSerializer
from .permissions import IsAuthenticatedProfile


class AuthMeView(GenericAPIView):
    permission_classes = [IsAuthenticatedProfile]
    serializer_class = AuthMeSerializer

    def get(self, request):
        return Response(AuthMeSerializer(request.user).data)

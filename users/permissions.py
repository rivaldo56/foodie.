from rest_framework import permissions

class IsClient(permissions.BasePermission):
    """
    Allows access only to users with the 'client' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'client')

class IsChef(permissions.BasePermission):
    """
    Allows access only to users with the 'chef' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'chef')

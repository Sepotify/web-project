from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import ArtistStatus, UserRole


class IsAdmin(BasePermission):
    """Only the system admin."""

    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsSupportOrAdmin(BasePermission):
    """Support staff or admin."""

    message = "Support or admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.SUPPORT, UserRole.ADMIN)
        )


class IsApprovedArtist(BasePermission):
    """Authenticated artist with an approved ArtistProfile."""

    message = "Approved artist account required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or user.role != UserRole.ARTIST:
            return False
        profile = getattr(user, "artist_profile", None)
        return bool(profile and profile.status == ArtistStatus.APPROVED)


class IsOwner(BasePermission):
    """Object-level: request.user owns the object (owner / user field)."""

    message = "You do not own this resource."

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None) or getattr(obj, "owner", None)
        if owner is None and hasattr(obj, "pk"):
            # Direct user object comparison
            return obj == request.user or getattr(obj, "id", None) == request.user.id
        return owner == request.user


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "user", None) or getattr(obj, "owner", None)
        return owner == request.user


class HasSubscriptionCapability(BasePermission):
    """
    Check a named capability from subscriptions.services.

    Set on the view:
        required_capability = "can_upload_avatar"
    """

    message = "Your subscription plan does not allow this action."

    def has_permission(self, request, view):
        capability = getattr(view, "required_capability", None)
        if not capability:
            return True
        if not request.user or not request.user.is_authenticated:
            return False

        from subscriptions import services as sub_services

        checker = getattr(sub_services, capability, None)
        if checker is None:
            return False
        return bool(checker(request.user))

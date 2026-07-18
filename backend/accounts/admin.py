from django.contrib import admin

from accounts.models import (
    ArtistFollow,
    ArtistProfile,
    PasswordResetToken,
    User,
    UserFollow,
    UserSettings,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "username", "display_name", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active")
    search_fields = ("email", "username", "display_name")
    ordering = ("-date_joined",)


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "stage_name", "status", "is_verified", "user", "created_at")
    list_filter = ("status", "is_verified")
    search_fields = ("stage_name", "user__email")


admin.site.register(UserFollow)
admin.site.register(ArtistFollow)
admin.site.register(UserSettings)
admin.site.register(PasswordResetToken)

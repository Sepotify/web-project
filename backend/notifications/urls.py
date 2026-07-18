from django.urls import path

from notifications.views import (
    NotificationDeleteView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path(
        "notifications/mark-all-read/",
        NotificationMarkAllReadView.as_view(),
        name="notifications-mark-all-read",
    ),
    path(
        "notifications/<int:pk>/read/",
        NotificationMarkReadView.as_view(),
        name="notifications-mark-read",
    ),
    path(
        "notifications/<int:pk>/",
        NotificationDeleteView.as_view(),
        name="notifications-delete",
    ),
]

from django.urls import path

from tickets.views import (
    TicketDetailView,
    TicketListCreateView,
    TicketReplyView,
    TicketStatusUpdateView,
)

urlpatterns = [
    path("tickets/", TicketListCreateView.as_view(), name="tickets-list-create"),
    path("tickets/<int:pk>/", TicketDetailView.as_view(), name="tickets-detail"),
    path("tickets/<int:pk>/reply/", TicketReplyView.as_view(), name="tickets-reply"),
    path(
        "tickets/<int:pk>/status/",
        TicketStatusUpdateView.as_view(),
        name="tickets-status",
    ),
]

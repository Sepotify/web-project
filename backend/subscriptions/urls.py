from django.urls import path

from subscriptions.views import (
    AdminPricingView,
    AdminSetUserSubscriptionView,
    MySubscriptionView,
    PaymentInitView,
    PaymentVerifyView,
    PricingView,
)

urlpatterns = [
    path("pricing/", PricingView.as_view(), name="pricing"),
    path("admin/pricing/", AdminPricingView.as_view(), name="admin-pricing"),
    path(
        "admin/users/<int:pk>/subscription/",
        AdminSetUserSubscriptionView.as_view(),
        name="admin-set-subscription",
    ),
    path("users/me/subscription/", MySubscriptionView.as_view(), name="me-subscription"),
    path("payments/init/", PaymentInitView.as_view(), name="payments-init"),
    path("payments/verify/", PaymentVerifyView.as_view(), name="payments-verify"),
    path("payments/callback/", PaymentVerifyView.as_view(), name="payments-callback"),
]

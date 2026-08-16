from django.urls import path

from reports.views import (
    RevenueAnalyticsView,
    SettlementConfirmView,
    SettlementListView,
    SubscriptionDistributionView,
)

urlpatterns = [
    path(
        "admin/analytics/subscription-distribution/",
        SubscriptionDistributionView.as_view(),
        name="admin-analytics-distribution",
    ),
    path(
        "admin/analytics/revenue/",
        RevenueAnalyticsView.as_view(),
        name="admin-analytics-revenue",
    ),
    path(
        "admin/finance/settlements/",
        SettlementListView.as_view(),
        name="admin-finance-settlements",
    ),
    path(
        "admin/finance/settlements/<int:pk>/confirm/",
        SettlementConfirmView.as_view(),
        name="admin-finance-settlements-confirm",
    ),
]

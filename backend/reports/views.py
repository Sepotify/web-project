from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin
from reports.models import ArtistSettlement, SettlementStatus
from reports.serializers import SettlementSerializer
from reports.services import (
    current_month_key,
    get_current_month_revenue_stats,
    get_subscription_distribution,
    sync_monthly_settlements,
)


def _money(value) -> float:
    return float(value)


class SubscriptionDistributionView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({"results": get_subscription_distribution()})


class RevenueAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        month_key = request.query_params.get("month") or current_month_key()
        stats = get_current_month_revenue_stats(month_key)
        return Response(
            {
                "month_key": stats["month_key"],
                "month_label": stats["month_label"],
                "total_revenue": _money(stats["total_revenue"]),
                "silver_revenue": _money(stats["silver_revenue"]),
                "gold_revenue": _money(stats["gold_revenue"]),
                "silver_subscribers": stats["silver_subscribers"],
                "gold_subscribers": stats["gold_subscribers"],
                "paying_subscribers": stats["paying_subscribers"],
                "silver_price": _money(stats["silver_price"]),
                "gold_price": _money(stats["gold_price"]),
            }
        )


class SettlementListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        month_key = request.query_params.get("month") or current_month_key()
        sync_monthly_settlements(month_key)
        qs = (
            ArtistSettlement.objects.filter(month_key=month_key)
            .select_related("artist")
            .order_by("-payout_amount", "artist_id")
        )
        return Response(
            {
                "month_key": month_key,
                "count": qs.count(),
                "results": SettlementSerializer(qs, many=True).data,
            }
        )


class SettlementConfirmView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        settlement = get_object_or_404(ArtistSettlement.objects.select_related("artist"), pk=pk)
        if settlement.status == SettlementStatus.PAID:
            return Response(
                {"detail": "Settlement is already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        settlement.status = SettlementStatus.PAID
        settlement.paid_at = timezone.now()
        settlement.save(update_fields=["status", "paid_at"])
        return Response(SettlementSerializer(settlement).data)

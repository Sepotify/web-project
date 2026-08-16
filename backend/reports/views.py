from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin
from catalog.serializers import AlbumSerializer, SongSerializer
from reports.models import ArtistSettlement, SettlementStatus
from reports.serializers import SettlementSerializer
from reports.services import (
    current_month_key,
    get_current_month_revenue_stats,
    get_home_feed,
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


class HomeFeedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limit = min(int(request.query_params.get("limit", 6)), 50)
        except (TypeError, ValueError):
            limit = 6
        feed = get_home_feed(limit=limit)
        ctx = {"request": request}
        return Response(
            {
                "latest_albums": AlbumSerializer(feed["latest_albums"], many=True, context=ctx).data,
                "popular_songs": SongSerializer(feed["popular_songs"], many=True, context=ctx).data,
                "early_access_songs": SongSerializer(
                    feed["early_access_songs"], many=True, context=ctx
                ).data,
            }
        )


class RecordSongStreamView(APIView):
    """Lightweight play counter used by reports/earnings later."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from catalog.models import Song
        from django.db.models import F

        song = get_object_or_404(Song, pk=pk)
        Song.objects.filter(pk=song.pk).update(
            stream_count=F("stream_count") + 1,
            listener_count=F("listener_count") + 1,
        )
        song.refresh_from_db()
        if song.album_id:
            from catalog.models import Album

            Album.objects.filter(pk=song.album_id).update(
                stream_count=F("stream_count") + 1,
                listener_count=F("listener_count") + 1,
            )
        artist = song.artist
        artist.total_streams = F("total_streams") + 1
        artist.total_listeners = F("total_listeners") + 1
        artist.save(update_fields=["total_streams", "total_listeners"])
        song.refresh_from_db()
        return Response(SongSerializer(song, context={"request": request}).data)

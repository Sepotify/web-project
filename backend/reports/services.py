from decimal import Decimal
from datetime import datetime

from django.db.models import Count, Sum
from django.utils import timezone

from accounts.models import ArtistProfile, ArtistStatus, User
from music.models import Song
from reports.models import ArtistSettlement, SettlementStatus
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier

EARNINGS_PER_STREAM = Decimal("0.002")

TIER_META = {
    SubscriptionTier.BASIC: {"label": "Basic", "color": "#71717a"},
    SubscriptionTier.SILVER: {"label": "Silver", "color": "#60a5fa"},
    SubscriptionTier.GOLD: {"label": "Gold", "color": "#fbbf24"},
}


def current_month_key(when=None) -> str:
    when = when or timezone.localdate()
    return f"{when.year:04d}-{when.month:02d}"


def format_month_key(month_key: str) -> str:
    year, month = month_key.split("-")
    date = datetime(int(year), int(month), 1)
    return date.strftime("%B %Y")


def calculate_artist_earnings(streams: int) -> Decimal:
    return (Decimal(streams) * EARNINGS_PER_STREAM).quantize(Decimal("0.01"))


def get_subscription_distribution() -> list[dict]:
    rows = (
        Subscription.objects.values("tier")
        .annotate(count=Count("id"))
        .order_by("tier")
    )
    counts = {tier: 0 for tier in SubscriptionTier.values}
    for row in rows:
        counts[row["tier"]] = row["count"]

    users_with_sub = Subscription.objects.count()
    total_users = User.objects.filter(is_active=True).count()
    counts[SubscriptionTier.BASIC] += max(total_users - users_with_sub, 0)

    total = sum(counts.values()) or 0
    segments = []
    for tier in (
        SubscriptionTier.BASIC,
        SubscriptionTier.SILVER,
        SubscriptionTier.GOLD,
    ):
        count = counts[tier]
        segments.append(
            {
                "tier": tier,
                "label": TIER_META[tier]["label"],
                "count": count,
                "percentage": round((count / total) * 1000) / 10 if total else 0,
                "color": TIER_META[tier]["color"],
            }
        )
    return segments


def get_current_month_revenue_stats(month_key: str | None = None) -> dict:
    month_key = month_key or current_month_key()
    pricing = PricingConfig.get_solo()

    silver_subscribers = Subscription.objects.filter(tier=SubscriptionTier.SILVER).count()
    gold_subscribers = Subscription.objects.filter(tier=SubscriptionTier.GOLD).count()

    silver_revenue = Decimal(silver_subscribers) * pricing.silver_monthly
    gold_revenue = Decimal(gold_subscribers) * pricing.gold_monthly

    return {
        "month_key": month_key,
        "month_label": format_month_key(month_key),
        "total_revenue": silver_revenue + gold_revenue,
        "silver_revenue": silver_revenue,
        "gold_revenue": gold_revenue,
        "silver_subscribers": silver_subscribers,
        "gold_subscribers": gold_subscribers,
        "paying_subscribers": silver_subscribers + gold_subscribers,
        "silver_price": pricing.silver_monthly,
        "gold_price": pricing.gold_monthly,
    }


def sync_monthly_settlements(month_key: str | None = None) -> int:
    """Create missing settlement rows for approved artists. Returns created count."""
    month_key = month_key or current_month_key()
    created = 0
    artists = ArtistProfile.objects.filter(status=ArtistStatus.APPROVED)
    existing = set(
        ArtistSettlement.objects.filter(month_key=month_key).values_list(
            "artist_id", flat=True
        )
    )

    for artist in artists:
        if artist.id in existing:
            continue
        aggregates = Song.objects.filter(artist=artist).aggregate(
            streams=Sum("stream_count"),
            listeners=Sum("listener_count"),
        )
        streams = aggregates["streams"] or artist.total_streams
        listeners = aggregates["listeners"] or artist.total_listeners
        ArtistSettlement.objects.create(
            artist=artist,
            month_key=month_key,
            unique_listeners=listeners,
            streams=streams,
            payout_amount=calculate_artist_earnings(streams),
            status=SettlementStatus.PENDING,
        )
        created += 1
    return created

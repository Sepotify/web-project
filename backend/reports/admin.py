from django.contrib import admin

from reports.models import ArtistSettlement


@admin.register(ArtistSettlement)
class ArtistSettlementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "artist",
        "month_key",
        "streams",
        "payout_amount",
        "status",
        "paid_at",
    )
    list_filter = ("status", "month_key")
    search_fields = ("artist__stage_name",)

from rest_framework import serializers

from reports.models import ArtistSettlement


class SettlementSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_stage_name = serializers.CharField(source="artist.stage_name", read_only=True)
    payout_amount = serializers.FloatField(read_only=True)

    class Meta:
        model = ArtistSettlement
        fields = [
            "id",
            "artist_id",
            "artist_stage_name",
            "month_key",
            "unique_listeners",
            "streams",
            "payout_amount",
            "status",
            "created_at",
            "paid_at",
        ]
        read_only_fields = fields

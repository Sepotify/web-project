from django.db import models


class SettlementStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"


class ArtistSettlement(models.Model):
    artist = models.ForeignKey(
        "accounts.ArtistProfile",
        on_delete=models.CASCADE,
        related_name="settlements",
    )
    month_key = models.CharField(max_length=7, db_index=True)  # YYYY-MM
    unique_listeners = models.PositiveIntegerField(default=0)
    streams = models.PositiveIntegerField(default=0)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=SettlementStatus.choices,
        default=SettlementStatus.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-payout_amount", "artist_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["artist", "month_key"],
                name="unique_artist_settlement_month",
            ),
        ]

    def __str__(self):
        return f"{self.artist_id} {self.month_key} ({self.status})"

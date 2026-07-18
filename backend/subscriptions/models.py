from django.conf import settings
from django.db import models
from django.utils import timezone


class SubscriptionTier(models.TextChoices):
    BASIC = "basic", "Basic"
    SILVER = "silver", "Silver"
    GOLD = "gold", "Gold"


class PricingConfig(models.Model):
    """
    Singleton-style pricing row. Admin updates silver/gold monthly prices
    without code changes. Use PricingConfig.get_solo().
    """

    silver_monthly = models.DecimalField(max_digits=12, decimal_places=2, default=99000)
    gold_monthly = models.DecimalField(max_digits=12, decimal_places=2, default=199000)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pricing config"
        verbose_name_plural = "Pricing config"

    def __str__(self):
        return f"Silver={self.silver_monthly} / Gold={self.gold_monthly}"

    def save(self, *args, **kwargs):
        self.pk = 1
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Subscription(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.BASIC,
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.user_id}:{self.tier} (active={self.is_active})"

    @property
    def is_currently_active(self) -> bool:
        if not self.is_active:
            return False
        if self.tier == SubscriptionTier.BASIC:
            return True
        if self.end_date and self.end_date < timezone.now():
            return False
        return True

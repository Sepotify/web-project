from django.contrib import admin

from subscriptions.models import PricingConfig, Subscription


@admin.register(PricingConfig)
class PricingConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "silver_monthly", "gold_monthly", "updated_at")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tier", "is_active", "start_date", "end_date")
    list_filter = ("tier", "is_active")
    search_fields = ("user__email",)

from django.contrib import admin

from subscriptions.models import PaymentTransaction, PricingConfig, Subscription


@admin.register(PricingConfig)
class PricingConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "silver_monthly", "gold_monthly", "updated_at")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tier", "is_active", "start_date", "end_date")
    list_filter = ("tier", "is_active")
    search_fields = ("user__email",)


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "tier",
        "duration_months",
        "amount",
        "status",
        "authority",
        "created_at",
    )
    list_filter = ("status", "tier")
    search_fields = ("user__email", "authority", "ref_id")
    readonly_fields = (
        "user",
        "tier",
        "duration_months",
        "amount",
        "merchant_id",
        "authority",
        "ref_id",
        "status",
        "created_at",
        "verified_at",
    )

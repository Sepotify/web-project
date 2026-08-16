"""Create and verify ZarinPal sandbox checkout sessions."""

from __future__ import annotations

import calendar
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from subscriptions.models import (
    PaymentStatus,
    PaymentTransaction,
    PricingConfig,
    SubscriptionTier,
)
from subscriptions.services import get_or_create_subscription
from subscriptions.zarinpal import ZarinpalError, request_payment, startpay_url, verify_payment

ALLOWED_DURATIONS = (1, 3, 6, 12)
PAID_TIERS = (SubscriptionTier.SILVER, SubscriptionTier.GOLD)


class PaymentError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def add_months(dt, months: int):
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def calculate_amount(tier: str, months: int) -> int:
    pricing = PricingConfig.get_solo()
    monthly = (
        pricing.silver_monthly if tier == SubscriptionTier.SILVER else pricing.gold_monthly
    )
    return int(Decimal(monthly) * months)


def init_payment(user, *, tier: str, duration_months: int) -> dict:
    if tier not in PAID_TIERS:
        raise PaymentError("Tier must be silver or gold.")
    if duration_months not in ALLOWED_DURATIONS:
        raise PaymentError("Duration must be 1, 3, 6, or 12 months.")

    amount = calculate_amount(tier, duration_months)
    merchant_id = uuid.uuid4()
    callback_url = settings.PAYMENT_CALLBACK_URL
    description = f"Upgrade to {tier} for {duration_months} month(s)"

    payment = PaymentTransaction.objects.create(
        user=user,
        tier=tier,
        duration_months=duration_months,
        amount=amount,
        merchant_id=merchant_id,
        status=PaymentStatus.PENDING,
    )

    try:
        authority = request_payment(
            merchant_id=str(merchant_id),
            amount=amount,
            description=description,
            callback_url=callback_url,
        )
    except ZarinpalError as exc:
        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])
        raise PaymentError(str(exc), status_code=502) from exc

    payment.authority = authority
    payment.save(update_fields=["authority"])
    return {
        "id": payment.pk,
        "authority": authority,
        "payment_url": startpay_url(authority),
        "amount": amount,
        "tier": tier,
        "duration_months": duration_months,
    }


def verify_checkout(*, authority: str, gateway_status: str | None = None) -> dict:
    if not authority:
        raise PaymentError("Missing authority.")

    with transaction.atomic():
        try:
            payment = (
                PaymentTransaction.objects.select_for_update()
                .select_related("user")
                .get(authority=authority)
            )
        except PaymentTransaction.DoesNotExist as exc:
            raise PaymentError("Payment not found.", status_code=404) from exc

        if payment.status == PaymentStatus.SUCCESS:
            return _serialize(payment, already_verified=True)

        if gateway_status and str(gateway_status).upper() != "OK":
            payment.status = PaymentStatus.FAILED
            payment.verified_at = timezone.now()
            payment.save(update_fields=["status", "verified_at"])
            return _serialize(payment)

        if payment.status == PaymentStatus.FAILED:
            return _serialize(payment)

        try:
            data = verify_payment(
                merchant_id=str(payment.merchant_id),
                amount=payment.amount,
                authority=payment.authority,
            )
        except ZarinpalError as exc:
            payment.status = PaymentStatus.FAILED
            payment.verified_at = timezone.now()
            payment.save(update_fields=["status", "verified_at"])
            raise PaymentError(str(exc), status_code=502) from exc

        payment.status = PaymentStatus.SUCCESS
        payment.ref_id = str(data.get("ref_id") or "")
        payment.verified_at = timezone.now()
        payment.save(update_fields=["status", "ref_id", "verified_at"])
        _activate_subscription(payment)
        return _serialize(payment)


def _activate_subscription(payment: PaymentTransaction) -> None:
    user = payment.user
    sub = get_or_create_subscription(user)
    now = timezone.now()
    base = now
    if (
        sub.is_currently_active
        and sub.tier == payment.tier
        and sub.end_date
        and sub.end_date > now
    ):
        base = sub.end_date
    sub.tier = payment.tier
    sub.is_active = True
    sub.start_date = now
    sub.end_date = add_months(base, payment.duration_months)
    sub.save()
    user.subscription = sub


def _serialize(payment: PaymentTransaction, already_verified: bool = False) -> dict:
    end_date = None
    try:
        end_date = payment.user.subscription.end_date
    except Exception:
        end_date = None
    return {
        "id": payment.pk,
        "status": payment.status,
        "tier": payment.tier,
        "duration_months": payment.duration_months,
        "amount": int(payment.amount),
        "authority": payment.authority,
        "ref_id": payment.ref_id,
        "already_verified": already_verified,
        "end_date": end_date,
    }

"""
ZarinPal sandbox client.

The sandbox request/verify calls have no authentication headers — only
merchant_id, amount, description/callback (request) or authority (verify).
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request

REQUEST_URL = "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
VERIFY_URL = "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
STARTPAY_TEMPLATE = "https://sandbox.zarinpal.com/pg/StartPay/{authority}"
TIMEOUT_SECONDS = 20


class ZarinpalError(Exception):
    def __init__(self, message: str, payload=None):
        super().__init__(message)
        self.payload = payload


def startpay_url(authority: str) -> str:
    return STARTPAY_TEMPLATE.format(authority=authority)


def _post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise ZarinpalError(f"Gateway HTTP {exc.code}", {"raw": raw}) from exc
    except urllib.error.URLError as exc:
        raise ZarinpalError("Could not reach payment gateway.") from exc

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ZarinpalError("Invalid gateway response.", {"raw": raw}) from exc

    if not isinstance(parsed, dict):
        raise ZarinpalError("Invalid gateway response.", parsed)
    return parsed


def _error_message(result: dict, fallback: str) -> str:
    errors = result.get("errors")
    if isinstance(errors, dict) and errors.get("message"):
        return str(errors["message"])
    if isinstance(errors, list) and errors:
        first = errors[0]
        if isinstance(first, dict) and first.get("message"):
            return str(first["message"])
        return str(first)
    data = result.get("data")
    if isinstance(data, dict) and data.get("message"):
        return str(data["message"])
    return fallback


def request_payment(
    *,
    merchant_id: str,
    amount: int,
    description: str,
    callback_url: str,
) -> str:
    result = _post_json(
        REQUEST_URL,
        {
            "merchant_id": str(merchant_id),
            "amount": int(amount),
            "description": description,
            "callback_url": callback_url,
        },
    )
    data = result.get("data")
    if isinstance(data, dict):
        authority = data.get("authority")
        code = data.get("code")
        if authority and code in (None, 100):
            return str(authority)
    raise ZarinpalError(_error_message(result, "Payment request failed."), result)


def verify_payment(*, merchant_id: str, amount: int, authority: str) -> dict:
    result = _post_json(
        VERIFY_URL,
        {
            "merchant_id": str(merchant_id),
            "amount": int(amount),
            "authority": authority,
        },
    )
    data = result.get("data")
    # 100 = verified, 101 = already verified on the gateway
    if isinstance(data, dict) and data.get("code") in (100, 101):
        return data
    raise ZarinpalError(_error_message(result, "Payment verification failed."), result)

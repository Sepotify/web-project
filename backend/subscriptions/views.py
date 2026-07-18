from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdmin
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier
from subscriptions.services import (
    can_download,
    can_early_access,
    can_see_stats,
    can_upload_avatar,
    daily_stream_limit,
    get_user_tier,
    max_playlists,
    set_user_tier,
)


class PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingConfig
        fields = ["silver_monthly", "gold_monthly", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        silver = attrs.get("silver_monthly", getattr(self.instance, "silver_monthly", None))
        gold = attrs.get("gold_monthly", getattr(self.instance, "gold_monthly", None))
        if silver is not None and silver <= 0:
            raise serializers.ValidationError({"silver_monthly": "Must be a positive number."})
        if gold is not None and gold <= 0:
            raise serializers.ValidationError({"gold_monthly": "Must be a positive number."})
        if silver is not None and gold is not None and gold <= silver:
            raise serializers.ValidationError(
                {"gold_monthly": "Gold price must be higher than Silver."}
            )
        return attrs


class SetUserTierSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=SubscriptionTier.choices)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)


class PricingView(APIView):
    """GET /api/pricing/ — public read of current subscription prices."""

    permission_classes = [AllowAny]

    def get(self, request):
        pricing = PricingConfig.get_solo()
        return Response(PricingSerializer(pricing).data)


class AdminPricingView(APIView):
    """PATCH /api/admin/pricing/ — admin-only price updates."""

    permission_classes = [IsAdmin]

    def patch(self, request):
        pricing = PricingConfig.get_solo()
        serializer = PricingSerializer(pricing, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PricingSerializer(pricing).data)


class AdminSetUserSubscriptionView(APIView):
    """PATCH /api/admin/users/<id>/subscription/ — manual tier for testing."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = SetUserTierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub = set_user_tier(
            user,
            serializer.validated_data["tier"],
            end_date=serializer.validated_data.get("end_date"),
            is_active=serializer.validated_data.get("is_active", True),
        )
        return Response(
            {
                "user_id": user.pk,
                "tier": sub.tier,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "is_active": sub.is_active,
            }
        )


class MySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tier = get_user_tier(user)
        try:
            sub = user.subscription
        except Subscription.DoesNotExist:
            sub = None
        return Response(
            {
                "tier": tier,
                "start_date": sub.start_date if sub else None,
                "end_date": sub.end_date if sub else None,
                "is_active": sub.is_active if sub else True,
                "capabilities": {
                    "can_upload_avatar": can_upload_avatar(user),
                    "max_playlists": max_playlists(user),
                    "daily_stream_limit": daily_stream_limit(user),
                    "can_see_stats": can_see_stats(user),
                    "can_early_access": can_early_access(user),
                    "can_download": can_download(user),
                },
            }
        )

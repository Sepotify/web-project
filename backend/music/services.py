from django.db.models import Q, QuerySet
from django.db.models.functions import Coalesce

CATALOG_SORT_CHOICES = (
    "newest",
    "oldest",
    "most_listeners",
    "most_streams",
    "title_asc",
)

DEFAULT_CATALOG_SORT = "newest"


def apply_catalog_search(queryset: QuerySet, query: str) -> QuerySet:
    normalized = (query or "").strip()
    if not normalized:
        return queryset
    return queryset.filter(
        Q(title__icontains=normalized) | Q(artist__stage_name__icontains=normalized)
    )


def apply_catalog_sort(queryset: QuerySet, sort: str) -> QuerySet:
    key = sort if sort in CATALOG_SORT_CHOICES else DEFAULT_CATALOG_SORT
    queryset = queryset.annotate(_release_year=Coalesce("release_year", 0))

    ordering = {
        "newest": ("-_release_year", "-created_at"),
        "oldest": ("_release_year", "created_at"),
        "most_listeners": ("-listener_count", "-created_at"),
        "most_streams": ("-stream_count", "-created_at"),
        "title_asc": ("title",),
    }[key]
    return queryset.order_by(*ordering)

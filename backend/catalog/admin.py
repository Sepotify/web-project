from django.contrib import admin

from catalog.models import Album, Song


class SongInline(admin.TabularInline):
    model = Song
    extra = 0
    fields = ("title", "release_year", "duration_seconds", "stream_count")
    show_change_link = True


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "artist", "release_year", "created_at")
    search_fields = ("title", "artist__stage_name")
    inlines = [SongInline]


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "artist", "album", "release_year", "stream_count")
    list_filter = ("is_early_access",)
    search_fields = ("title", "artist__stage_name")
    filter_horizontal = ("featured_artists",)

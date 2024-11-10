# myapp/sitemaps.py
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Post  # import your model

class VideoSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.7

    def items(self):
        # Import Video only when needed to avoid circular import
        from .models import Video  # Lazy import
        return Video.objects.all()

    def lastmod(self, obj):
        return obj.uploaded_at
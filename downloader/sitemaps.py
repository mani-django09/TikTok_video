# downloader/sitemaps.py
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.conf import settings

class StaticViewSitemap(Sitemap):
    priority = 0.9
    changefreq = "daily"
    protocol = 'http'  # Use 'https' in production

    def items(self):
        # Only include public pages, not API endpoints
        return [
            'downloader:home',
            # Add other public pages here
        ]

    def location(self, item):
        url = reverse(item)
        return url  # Django will automatically add the domain
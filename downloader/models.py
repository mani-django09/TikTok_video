from django.db import models
from django.utils import timezone
from django.contrib.sitemaps import Sitemap


class VideoDownload(models.Model):
    url = models.URLField(max_length=500)
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    last_downloaded = models.DateTimeField(auto_now=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    
    def __str__(self):
        return f"Video: {self.url} (Downloaded: {self.download_count} times)"


# downloader/models.py
class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Video(models.Model):
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to='videos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def __str__(self):
        return self.title
    


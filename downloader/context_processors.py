from django.conf import settings

def social_media_urls(request):
    return {
        'SOCIAL_MEDIA': settings.SOCIAL_MEDIA
    }
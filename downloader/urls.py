from django.urls import path
from . import views
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings


app_name = 'downloader'



urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('api/video-info/', views.get_video_info, name='get_video_info'),
    path('api/process/', views.process_video, name='process_video'),
    path('download/<str:filename>', views.download_file, name='download_file'),
    path('download-mp3/', views.mp3_download, name='download_mp3'),
    path('download-mp4/', views.mp4_download, name='download_mp4'),
    path('contact/', views.contact, name='contact'),  # Add this line
    path('privacy/', views.privacy_policy, name='privacy_policy'),  # Add this line
    path('terms/', views.terms_of_service, name='terms'),  # Add this line



   
] 
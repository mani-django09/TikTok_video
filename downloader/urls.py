from django.urls import path
from . import views
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings


app_name = 'downloader'

<<<<<<< HEAD


=======
>>>>>>> 4851d4c23bbbfec86b05d0faf9f82bb7595cc44a
urlpatterns = [
  path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('api/video-info/', views.get_video_info, name='get_video_info'),
    path('api/process/', views.process_video, name='process_video'),
    path('download/<str:filename>', views.download_file, name='download_file'),
<<<<<<< HEAD
    path('download-mp3/', views.download_mp3, name='download_mp3'),
    path('how-to-save/', views.how_to_save, name='how_to_save'),
   
=======
>>>>>>> 4851d4c23bbbfec86b05d0faf9f82bb7595cc44a
] 
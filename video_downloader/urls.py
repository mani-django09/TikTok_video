"""
URL configuration for video_downloader project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from downloader import views
from django.conf import settings
from django.conf.urls.static import static
from downloader.sitemaps import StaticViewSitemap
from django.views.generic.base import TemplateView
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
import xml.dom.minidom

sitemaps = {
    'static': StaticViewSitemap,
}


def test_sitemap_view(request):
    try:
        response = HttpResponse(content_type='text/plain')
        response.write("Testing Sitemap...\n\n")
        
        # Test sitemap.xml
        sitemap_url = request.build_absolute_uri('/sitemap.xml')
        response.write(f"Sitemap URL: {sitemap_url}\n")
        
        import requests
        sitemap_response = requests.get(sitemap_url)
        response.write(f"Status Code: {sitemap_response.status_code}\n")
        
        if sitemap_response.status_code == 200:
            # Pretty print XML
            dom = xml.dom.minidom.parseString(sitemap_response.content)
            pretty_xml = dom.toprettyxml()
            response.write("\nSitemap Content:\n")
            response.write(pretty_xml)
        
        return response
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", content_type='text/plain')
    
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('downloader.urls', namespace='downloader')),  # Add namespace
      path('sitemap.xml', sitemap, {
        'sitemaps': sitemaps,
        'template_name': 'sitemap.xml',
        'content_type': 'application/xml'
    }, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', TemplateView.as_view(template_name="robots.txt", 
         content_type="text/plain")),
    path('test-sitemap/', test_sitemap_view, name='test_sitemap'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

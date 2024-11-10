from django.shortcuts import render,redirect
from django.http import JsonResponse, FileResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings
import logging
import json
import requests
from .forms import ContactForm
import os
import re
import time
from bs4 import BeautifulSoup
from django.contrib import messages
import logging
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.template import loader
from django.utils import timezone
from datetime import datetime


logger = logging.getLogger(__name__)


FAQ_DATA = [
    {
        'question': 'How to download TikTok videos?',
        'answer': 'Simply paste the TikTok video URL in the input field above, select your preferred quality, and click download.'
    },
    {
        'question': 'Is it free to use?',
        'answer': 'Yes, our service is completely free to use with no limitations or restrictions.'
    },
    {
        'question': 'Can I download videos without watermark?',
        'answer': 'Yes, you can download TikTok videos without watermark in HD quality by using our service.'
    },
    {
        'question': 'What formats are supported?',
        'answer': 'We support MP4 video downloads in both HD and SD quality, as well as MP3 audio extraction.'
    },
    {
        'question': 'Is there a download limit?',
        'answer': 'No, there is no limit to the number of videos you can download.'
    },
    {
        'question': 'Do I need to install any software?',
        'answer': 'No, our service is completely web-based. No need to install any software.'
    }
]

logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def home(request):
    return render(request, 'downloader/home.html')

@csrf_exempt

@csrf_exempt
def get_video_info(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'})
    
    try:
        data = json.loads(request.body)
        url = data.get('url')
        
        if not url:
            return JsonResponse({'status': 'error', 'message': 'URL is required'})

        # Get video information using alternative API
        video_info = fetch_tiktok_info(url)
        
        return JsonResponse({
            'status': 'success',
            'data': video_info
        })
        
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })


@csrf_exempt
def process_video(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'})

    try:
        data = json.loads(request.body)
        url = data.get('url')
        quality = data.get('quality', 'hd')
        remove_watermark = data.get('remove_watermark', True)

        if not url:
            return JsonResponse({
                'status': 'error',
                'message': 'URL is required'
            })

        # Get video info
        video_info = fetch_tiktok_info(url)
        
        # Get appropriate download URL based on quality
        if quality == 'audio':
            download_url = video_info['download_urls']['audio']
        else:
            download_url = video_info['download_urls']['hd'] if quality == 'hd' else video_info['download_urls']['sd']

        if not download_url:
            raise ValueError("No download URL available")

        # Download the video
        filename = download_video(download_url, video_info['id'])
        if not filename:
            raise ValueError("Failed to download video")

        return JsonResponse({
            'status': 'success',
            'message': 'Video downloaded successfully!',
            'download_url': f'/download/{filename}'
        })

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

def download_video(url, video_id):
    """Download video and save to file"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://tikwm.com/'
        }
        
        response = requests.get(url, headers=headers, stream=True)
        if response.status_code != 200:
            raise ValueError(f"Download failed with status: {response.status_code}")

        # Generate filename
        filename = f"tiktok_{video_id}_{int(time.time())}.mp4"
        file_path = os.path.join(settings.MEDIA_ROOT, 'downloads', filename)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Save file in chunks
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        return filename

    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return None

def fetch_tiktok_info(url):
    """Fetch video information using TikWM API"""
    try:
        api_url = "https://tikwm.com/api/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        params = {
            'url': url,
            'hd': 1
        }
        
        response = requests.post(api_url, data=params, headers=headers)
        if response.status_code != 200:
            raise ValueError(f"API request failed with status: {response.status_code}")

        data = response.json()
        if data.get('code') != 0:
            raise ValueError(data.get('msg', 'Failed to fetch video information'))

        video_data = data.get('data', {})
        
        # Extract information
        return {
            'id': video_data.get('id', ''),
            'title': video_data.get('title', 'TikTok Video'),
            'author': video_data.get('author', {}).get('unique_id', 'user'),
            'thumbnail': video_data.get('cover', video_data.get('origin_cover', '')),
            'plays': video_data.get('play_count', 0),
            'likes': video_data.get('digg_count', 0),
            'shares': video_data.get('share_count', 0),
            'url': url,
            'download_urls': {
                'hd': video_data.get('hdplay', video_data.get('play', '')),
                'sd': video_data.get('play', ''),
                'audio': video_data.get('music', video_data.get('music_info', {}).get('play', ''))
            }
        }

    except Exception as e:
        logger.error(f"Error fetching TikTok info: {str(e)}")
        raise ValueError(f"Failed to fetch video information: {str(e)}")

def extract_video_id(url):
    """Extract video ID from TikTok URL"""
    try:
        # Handle different URL formats
        patterns = [
            r'/video/(\d+)',
            r'/v/(\d+)',
            r'@[\w.-]+/video/(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
                
        # Handle shortened URLs
        if 'vm.tiktok.com' in url or 'vt.tiktok.com' in url:
            response = requests.head(url, allow_redirects=True)
            return extract_video_id(response.url)
            
        return None
    except Exception as e:
        logger.error(f"Error extracting video ID: {str(e)}")
        return None

@require_http_methods(["GET"])

@require_http_methods(["GET"])
def download_file(request, filename):
    try:
        file_path = os.path.join(settings.MEDIA_ROOT, 'downloads', filename)
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Type'] = 'video/mp4'
            return response
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'File not found'
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Error downloading file'
        })
    
def home(request):
    return render(request, 'downloader/home.html')

def mp3_download(request):
    return render(request, 'downloader/download_mp3.html')

def mp4_download(request):
    return render(request, 'downloader/mp4_download.html')
def contact(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            try:
                # Get form data
                name = form.cleaned_data['name']
                email = form.cleaned_data['email']
                subject = form.cleaned_data['subject']
                message = form.cleaned_data['message']

                # Create email content
                email_content = f"""
                New Contact Form Submission

                Name: {name}
                Email: {email}
                Subject: {subject}
                Message: {message}
                """

                # Send email using EmailMessage
                email = EmailMessage(
                    subject=f'Contact Form: {subject}',
                    body=email_content,
                    from_email=settings.EMAIL_HOST_USER,
                    to=[settings.EMAIL_HOST_USER],
                    reply_to=[email]
                )
                email.send(fail_silently=False)

                messages.success(request, 'Your message has been sent successfully!')
                return redirect('downloader:contact')

            except Exception as e:
                print(f"Email error: {str(e)}")  # For debugging
                messages.error(request, 'Failed to send message. Please try again later.')
    else:
        form = ContactForm()

    return render(request, 'downloader/contact.html', {'form': form})

def privacy_policy(request):
    # If accessed without trailing slash, redirect to version with slash
    if not request.path.endswith('/'):
        return redirect(request.path + '/')
    return render(request, 'downloader/privacy_policy.html')

def terms_of_service(request):
    return render(request, 'downloader/terms.html')


def sitemap(request):
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    xml_sitemap = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{0}://{1}/</loc>
        <lastmod>{2}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{0}://{1}/privacy-policy/</loc>
        <lastmod>{2}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>{0}://{1}/terms/</loc>
        <lastmod>{2}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>{0}://{1}/contact/</loc>
        <lastmod>{2}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
'''.format(
    request.scheme,
    request.get_host(),
    current_date
)

    response = HttpResponse(xml_sitemap, content_type='application/xml; charset=UTF-8')
    response['Content-Length'] = len(xml_sitemap)
    return response
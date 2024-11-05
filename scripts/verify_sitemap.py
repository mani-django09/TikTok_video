# scripts/verify_sitemap.py
import requests
import xml.etree.ElementTree as ET
import logging
import sys
import time
from urllib.parse import urljoin

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_server_running(base_url):
    """Check if Django server is running"""
    try:
        requests.get(base_url)
        return True
    except requests.exceptions.ConnectionError:
        return False

def verify_sitemap(base_url='http://localhost:8000'):
    print("\nSitemap Verification Tool")
    print("========================")
    
    # Check if server is running
    if not check_server_running(base_url):
        print("\n❌ ERROR: Django server is not running!")
        print("\nPlease start the server first:")
        print("1. Open a new terminal window")
        print("2. Navigate to your project directory")
        print("3. Run: python manage.py runserver")
        print("\nThen run this script again.")
        return

    sitemap_url = urljoin(base_url, 'sitemap.xml')
    print(f"\n📋 Checking sitemap at: {sitemap_url}")

    try:
        response = requests.get(sitemap_url)
        if response.status_code == 200:
            print("\n✅ Successfully fetched sitemap")
            
            # Check if content starts with XML declaration
            content = response.text
            if not content.startswith('<?xml'):
                print("\n⚠️  Warning: XML declaration missing or not at start")
                print("Content starts with:", content[:50])
                return

            # Parse XML
            root = ET.fromstring(content)
            urls = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url')
            
            print(f"\n📍 Found {len(urls)} URLs in sitemap:")
            for url in urls:
                loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                changefreq = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}changefreq')
                priority = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}priority')
                
                print(f"\nURL: {loc.text if loc is not None else 'No location'}")
                print(f"Changefreq: {changefreq.text if changefreq is not None else 'Not set'}")
                print(f"Priority: {priority.text if priority is not None else 'Not set'}")
                
                # Test URL accessibility
                try:
                    url_response = requests.get(loc.text)
                    status = "✅" if url_response.status_code == 200 else "❌"
                    print(f"Status: {status} {url_response.status_code}")
                except Exception as e:
                    print(f"Error accessing URL: ❌ {str(e)}")

            print("\n✅ Sitemap verification completed!")

        else:
            print(f"\n❌ Failed to fetch sitemap: {response.status_code}")
            print(f"Response content: {response.text[:200]}")
            
    except ET.ParseError as e:
        print(f"\n❌ XML parsing error: {str(e)}")
        print("Raw content:", response.text[:200])
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

    print("\nDone!")

if __name__ == "__main__":
    try:
        verify_sitemap()
    except KeyboardInterrupt:
        print("\n\nVerification cancelled by user.")
        sys.exit(0)
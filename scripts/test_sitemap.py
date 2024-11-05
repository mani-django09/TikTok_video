# scripts/test_sitemap.py
import requests
import xml.etree.ElementTree as ET
import logging
from datetime import datetime
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_sitemap(base_url="http://localhost:8000"):
    """Test sitemap functionality"""
    sitemap_url = f"{base_url}/sitemap.xml"
    
    logger.info(f"Testing sitemap at: {sitemap_url}")
    results = {
        'success': False,
        'urls_found': 0,
        'urls_tested': 0,
        'errors': []
    }
    
    try:
        # First, test if server is running
        try:
            requests.get(base_url)
        except requests.exceptions.ConnectionError:
            logger.error("ERROR: Django server is not running!")
            logger.error("Please start the server with 'python manage.py runserver' first")
            return results

        # Test sitemap.xml
        response = requests.get(sitemap_url)
        logger.info(f"Sitemap Status Code: {response.status_code}")
        
        if response.status_code == 200:
            # Parse XML
            root = ET.fromstring(response.content)
            urls = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url')
            results['urls_found'] = len(urls)
            
            logger.info(f"Found {len(urls)} URLs in sitemap")
            
            # Test each URL
            for url in urls:
                loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text
                try:
                    url_response = requests.get(loc)
                    logger.info(f"Testing URL: {loc}")
                    logger.info(f"Status Code: {url_response.status_code}")
                    results['urls_tested'] += 1
                except Exception as e:
                    error_msg = f"Error testing URL {loc}: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)
            
            # Test robots.txt
            robots_url = f"{base_url}/robots.txt"
            try:
                robots_response = requests.get(robots_url)
                logger.info(f"\nRobots.txt Status Code: {robots_response.status_code}")
                if robots_response.status_code == 200:
                    logger.info("Robots.txt content:")
                    logger.info(robots_response.text)
            except Exception as e:
                error_msg = f"Error testing robots.txt: {str(e)}"
                logger.error(error_msg)
                results['errors'].append(error_msg)
            
            results['success'] = True
        else:
            error_msg = f"Sitemap returned status code: {response.status_code}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
            
    except Exception as e:
        error_msg = f"Error testing sitemap: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)
    
    return results

if __name__ == "__main__":
    print("\nSitemap Test Tool")
    print("================")
    print("\n1. Make sure Django server is running (python manage.py runserver)")
    print("2. Testing sitemap...\n")
    
    results = test_sitemap()
    
    print("\nTest Results")
    print("===========")
    print(f"Success: {results['success']}")
    print(f"URLs Found: {results['urls_found']}")
    print(f"URLs Tested: {results['urls_tested']}")
    
    if results['errors']:
        print("\nErrors:")
        for error in results['errors']:
            print(f"- {error}")
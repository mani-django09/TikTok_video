# scripts/test_urls.py
import requests
from urllib.parse import urljoin
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_urls(base_url='http://localhost:8000'):
    urls_to_test = [
        '',                # Home page
        '/sitemap.xml',    # Sitemap
        '/robots.txt',     # Robots.txt
    ]
    
    logger.info(f"Testing URLs at {base_url}")
    
    for url_path in urls_to_test:
        full_url = urljoin(base_url, url_path)
        try:
            response = requests.get(full_url)
            logger.info(f"{full_url}: {response.status_code}")
            if response.status_code == 200:
                logger.info("Success!")
                if url_path == '/sitemap.xml':
                    logger.info(f"Sitemap content:\n{response.text[:500]}...")
            else:
                logger.error(f"Failed with status code: {response.status_code}")
        except Exception as e:
            logger.error(f"Error testing {full_url}: {e}")

if __name__ == "__main__":
    test_urls()
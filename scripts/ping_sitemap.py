# scripts/ping_sitemap.py
import os
import sys
import urllib.request
import urllib.error
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/sitemap_ping.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def ensure_log_directory():
    """Ensure the logs directory exists."""
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    return log_dir

def ping_search_engines():
    """Ping search engines to notify them of sitemap updates."""
    
    # Ensure log directory exists
    ensure_log_directory()
    
    sitemap_url = 'https://ssstik.uno/sitemap.xml'
    search_engines = {
        'Google': f'https://www.google.com/ping?sitemap={sitemap_url}',
        'Bing': f'https://www.bing.com/ping?sitemap={sitemap_url}',
        'Yandex': f'https://blogs.yandex.ru/pings/?status=success&url={sitemap_url}'
    }
    
    logger.info(f"Starting sitemap ping at {datetime.now()}")
    
    for engine, ping_url in search_engines.items():
        try:
            response = urllib.request.urlopen(ping_url)
            if response.status == 200:
                logger.info(f"Successfully pinged {engine}")
            else:
                logger.warning(f"Ping to {engine} returned status code {response.status}")
        except urllib.error.URLError as e:
            logger.error(f"Failed to ping {engine}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error pinging {engine}: {str(e)}")

if __name__ == "__main__":
    try:
        ping_search_engines()
        logger.info("Sitemap ping completed successfully")
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
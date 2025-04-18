import requests
import os
import json
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time
import re

class WaybackDownloaderAdvanced:
    def __init__(self, url):
        self.base_url = url
        self.wayback_api = "https://archive.org/wayback/available"
        self.download_dir = "website_backup"
        self.downloaded_urls = set()
        self.max_retries = 3
        
    def get_snapshot_url(self, timestamp=None):
        params = {"url": self.base_url}
        if timestamp:
            params["timestamp"] = timestamp
            
        for _ in range(self.max_retries):
            try:
                response = requests.get(self.wayback_api, params=params)
                data = response.json()
                
                if "archived_snapshots" in data and "closest" in data["archived_snapshots"]:
                    return data["archived_snapshots"]["closest"]["url"]
            except Exception as e:
                print(f"Error accessing Wayback API: {str(e)}")
                time.sleep(1)
        return None
        
    def download_page(self, url, path):
        if url in self.downloaded_urls:
            return
            
        for _ in range(self.max_retries):
            try:
                response = requests.get(url)
                os.makedirs(os.path.dirname(path), exist_ok=True)
                
                with open(path, "wb") as f:
                    f.write(response.content)
                print(f"Downloaded: {path}")
                self.downloaded_urls.add(url)
                
                # Parse and download assets
                if path.endswith('.html'):
                    self.process_html_content(response.text, os.path.dirname(path))
                break
                
            except Exception as e:
                print(f"Error downloading {url}: {str(e)}")
                time.sleep(1)
                
    def process_html_content(self, html_content, base_path):
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Download images
        for img in soup.find_all('img'):
            if img.get('src'):
                img_url = urljoin(self.base_url, img['src'])
                img_path = os.path.join(base_path, 'images', os.path.basename(img['src']))
                self.download_page(img_url, img_path)
                
        # Download CSS
        for css in soup.find_all('link', rel='stylesheet'):
            if css.get('href'):
                css_url = urljoin(self.base_url, css['href'])
                css_path = os.path.join(base_path, 'css', os.path.basename(css['href']))
                self.download_page(css_url, css_path)
                
        # Download JavaScript
        for js in soup.find_all('script', src=True):
            if js.get('src'):
                js_url = urljoin(self.base_url, js['src'])
                js_path = os.path.join(base_path, 'js', os.path.basename(js['src']))
                self.download_page(js_url, js_path)
                
        # Find and process internal links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if self.is_internal_link(href):
                link_url = urljoin(self.base_url, href)
                link_path = os.path.join(base_path, href.lstrip('/'))
                self.download_page(link_url, link_path)
                
    def is_internal_link(self, url):
        if not url:
            return False
        if url.startswith('#'):
            return False
        if url.startswith('http'):
            return urlparse(url).netloc == urlparse(self.base_url).netloc
        return True
        
    def download_website(self):
        # Create backup directory
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
            
        # Get May 2023 snapshot
        timestamp = "202305"
        snapshot_url = self.get_snapshot_url(timestamp)
        
        if snapshot_url:
            self.download_page(snapshot_url, f"{self.download_dir}/index.html")
        else:
            print("No snapshot found for the specified date")

def main():
    # Replace with your WordPress site URL
    website_url = "https://your-wordpress-site.com"
    
    downloader = WaybackDownloaderAdvanced(website_url)
    downloader.download_website()

if __name__ == "__main__":
    main() 
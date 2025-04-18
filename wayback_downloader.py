import requests
import os
import json
from datetime import datetime
from urllib.parse import urljoin
import time

class WaybackDownloader:
    def __init__(self, url):
        self.base_url = url
        self.wayback_api = "https://archive.org/wayback/available"
        self.download_dir = "website_backup"
        
    def get_snapshot_url(self, timestamp=None):
        params = {"url": self.base_url}
        if timestamp:
            params["timestamp"] = timestamp
            
        response = requests.get(self.wayback_api, params=params)
        data = response.json()
        
        if "archived_snapshots" in data and "closest" in data["archived_snapshots"]:
            return data["archived_snapshots"]["closest"]["url"]
        return None
        
    def download_page(self, url, path):
        try:
            response = requests.get(url)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            
            with open(path, "wb") as f:
                f.write(response.content)
            print(f"Downloaded: {path}")
            
        except Exception as e:
            print(f"Error downloading {url}: {str(e)}")
            
    def download_website(self):
        # Create backup directory
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
            
        # Get May 2023 snapshot
        timestamp = "202305"
        snapshot_url = self.get_snapshot_url(timestamp)
        
        if snapshot_url:
            # Download main page
            self.download_page(snapshot_url, f"{self.download_dir}/index.html")
            
            # You might want to add more sophisticated crawling logic here
            # to download additional pages, images, and assets
            
        else:
            print("No snapshot found for the specified date")

def main():
    # Replace with your WordPress site URL
    website_url = "https://your-wordpress-site.com"
    
    downloader = WaybackDownloader(website_url)
    downloader.download_website()

if __name__ == "__main__":
    main() 
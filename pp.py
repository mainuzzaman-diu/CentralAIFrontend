import requests
import xml.etree.ElementTree as ET
import csv
import time
import random

# List of User-Agents for rotation
user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
]

# Function to fetch and parse the XML from a URL with error handling, retries, and delays
def fetch_sitemap(url, session):
    headers = {
        'User-Agent': random.choice(user_agents)
    }
    for attempt in range(5):  # Retry up to 5 times
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()  # Raise HTTPError for bad responses
            return ET.fromstring(response.content)
        except requests.exceptions.RequestException as e:
            print(f"Request error for URL {url}: {e}")
            if response.status_code in [429, 403]:  # Too Many Requests or Forbidden
                delay = (2 ** attempt) + random.uniform(0, 1)  # Exponential backoff
                print(f"Rate limited. Retrying in {delay:.2f} seconds...")
                time.sleep(delay)
            else:
                break
        except ET.ParseError as e:
            print(f"XML parse error for URL {url}: {e}")
            break
    return None

# List to hold all instructor profile URLs
instructor_profile_urls = []

# Function to extract instructor profile URLs from a sitemap URL
def extract_profile_urls(sitemap_url, session):
    sitemap_root = fetch_sitemap(sitemap_url, session)
    if sitemap_root is not None:
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_element in sitemap_root.findall('ns:url', namespace):
            loc = url_element.find('ns:loc', namespace).text
            instructor_profile_urls.append(loc)

# Read the previously saved CSV with sitemap URLs
sitemap_urls = []
with open('instructor_sitemaps.csv', mode='r') as file:
    reader = csv.reader(file)
    next(reader)  # Skip header
    for row in reader:
        sitemap_urls.append(row[0])

# Use a session to handle cookies and persistent headers
session = requests.Session()

# Process each sitemap URL to extract profile URLs
for sitemap_url in sitemap_urls:
    extract_profile_urls(sitemap_url, session)
    time.sleep(random.uniform(3, 7))  # Add longer random delay between requests

# Write the instructor profile URLs to a new CSV file
csv_filename = 'instructor_profiles.csv'
with open(csv_filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Instructor Profile URLs"])
    for url in instructor_profile_urls:
        writer.writerow([url])

print(f"Saved {len(instructor_profile_urls)} instructor profile URLs to {csv_filename}")

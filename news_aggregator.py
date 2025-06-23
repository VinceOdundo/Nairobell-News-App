#!/usr/bin/env python3
"""
African News Aggregation Service
Real-time news aggregation from multiple African and international sources
Enhanced for production use with better error handling and caching
Now using GNews API instead of NewsAPI
"""

import requests
import feedparser
import json
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
import hashlib
import re
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import os
from dotenv import load_dotenv
import time
from concurrent.futures import ThreadPoolExecutor
import sqlite3
import schedule

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('news_aggregator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class NewsArticle:
    """Data class for news articles"""
    id: str
    title: str
    description: str
    content: str
    url: str
    thumbnail: Optional[str]
    source: str
    category: str
    country_focus: List[str]
    language: str
    published_at: datetime
    is_breaking: bool = False
    is_trending: bool = False
    engagement_score: float = 0.0
    credibility_score: float = 5.0

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['published_at'] = self.published_at.isoformat()
        return data

    @classmethod
    def from_feed_entry(cls, entry, source_config):
        """Create NewsArticle from RSS feed entry"""
        # Generate unique ID
        article_id = hashlib.md5(
            f"{entry.link}{entry.title}".encode()).hexdigest()

        # Extract published date
        published_at = datetime.now()
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            published_at = datetime(*entry.published_parsed[:6])
        elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
            published_at = datetime(*entry.updated_parsed[:6])

        # Extract thumbnail
        thumbnail = None
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            thumbnail = entry.media_thumbnail[0]['url']
        elif hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if enclosure.type.startswith('image/'):
                    thumbnail = enclosure.href
                    break

        # Clean description
        description = getattr(entry, 'summary', '')
        if description:
            # Remove HTML tags
            description = re.sub(r'<[^>]+>', '', description)
            description = description.strip(
            )[:300] + ('...' if len(description) > 300 else '')

        return cls(
            id=article_id,
            title=entry.title,
            description=description,
            content=getattr(entry, 'content', [{}])[0].get(
                'value', description) if hasattr(entry, 'content') else description,
            url=entry.link,
            thumbnail=thumbnail,
            source=source_config['name'],
            category=source_config.get('category', 'general'),
            country_focus=[source_config.get('country', 'africa')],
            language=source_config.get('language', 'en'),
            published_at=published_at,
            credibility_score=source_config.get('credibility', 5.0)
        )


class AfricanNewsAggregator:
    """Main news aggregation service for African news sources"""

    def __init__(self):
        # GNews API configuration
        self.gnews_api_key = os.getenv(
            'GNEWS_API_KEY', 'bab8859f3225f004320365ab98bb7076')
        self.gnews_base_url = 'https://gnews.io/api/v4'

        # African countries for GNews API
        self.african_countries = {
            'nigeria': 'ng',
            'kenya': 'ke',
            'south-africa': 'za',
            'ghana': 'gh',
            'ethiopia': 'et',
            'egypt': 'eg',
            'morocco': 'ma',
            'tunisia': 'tn',
            'uganda': 'ug',
            'tanzania': 'tz',
            'algeria': 'dz',
            'angola': 'ao'
        }

        self.news_sources = {
            # International sources covering Africa
            'bbc_africa': {
                'name': 'BBC Africa',
                'rss_url': 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
                'website': 'https://www.bbc.com/news/world/africa',
                'country': 'international',
                'language': 'en',
                'category': 'general',
                'credibility': 9.0
            },
            'aljazeera_africa': {
                'name': 'Al Jazeera Africa',
                'rss_url': 'https://www.aljazeera.com/xml/rss/all.xml',
                'website': 'https://www.aljazeera.com/africa/',
                'country': 'international',
                'language': 'en',
                'category': 'general',
                'credibility': 8.5
            },
            'cnn_africa': {
                'name': 'CNN Africa',
                'rss_url': 'http://rss.cnn.com/rss/edition.rss',
                'website': 'https://edition.cnn.com/africa',
                'country': 'international',
                'language': 'en',
                'category': 'general',
                'credibility': 8.0
            },

            # East Africa
            'daily_nation_kenya': {
                'name': 'Daily Nation Kenya',
                'rss_url': 'https://nation.africa/kenya/rss',
                'website': 'https://nation.africa/kenya',
                'country': 'kenya',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'the_star_kenya': {
                'name': 'The Star Kenya',
                'rss_url': 'https://www.the-star.co.ke/feed/',
                'website': 'https://www.the-star.co.ke/',
                'country': 'kenya',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            # Nigeria
            'punch_nigeria': {
                'name': 'The Punch Nigeria',
                'rss_url': 'https://punchng.com/feed/',
                'website': 'https://punchng.com/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'vanguard_nigeria': {
                'name': 'Vanguard Nigeria',
                'rss_url': 'https://www.vanguardngr.com/feed/',
                'website': 'https://www.vanguardngr.com/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'premium_times_nigeria': {
                'name': 'Premium Times Nigeria',
                'rss_url': 'https://www.premiumtimesng.com/feed',
                'website': 'https://www.premiumtimesng.com/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 8.0
            },

            # South Africa
            'news24_sa': {
                'name': 'News24 South Africa',
                'rss_url': 'https://feeds.24.com/articles/news24/rss',
                'website': 'https://www.news24.com/',
                'country': 'south_africa',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'iol_sa': {
                'name': 'IOL South Africa',
                'rss_url': 'https://www.iol.co.za/cmlink/1.730.rss',
                'website': 'https://www.iol.co.za/',
                'country': 'south_africa',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },

            # Ghana
            'graphic_ghana': {
                'name': 'Graphic Online Ghana',
                'rss_url': 'https://www.graphic.com.gh/rss/news.xml',
                'website': 'https://www.graphic.com.gh/',
                'country': 'ghana',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'myjoyonline_ghana': {
                'name': 'MyJoyOnline Ghana',
                'rss_url': 'https://www.myjoyonline.com/feed/',
                'website': 'https://www.myjoyonline.com/',
                'country': 'ghana',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },

            # Business and Tech focused
            'african_business': {
                'name': 'African Business',
                'rss_url': 'https://african.business/feed',
                'website': 'https://african.business/',
                'country': 'africa',
                'language': 'en',
                'category': 'business',
                'credibility': 8.0
            },
            'techcabal': {
                'name': 'TechCabal',
                'rss_url': 'https://techcabal.com/feed/',
                'website': 'https://techcabal.com/',
                'country': 'africa',
                'language': 'en',
                'category': 'technology',
                'credibility': 8.5
            },
            'disrupt_africa': {
                'name': 'Disrupt Africa',
                'rss_url': 'https://disrupt-africa.com/feed/',
                'website': 'https://disrupt-africa.com/',
                'country': 'africa',
                'language': 'en',
                'category': 'technology',
                'credibility': 7.5
            }
        }

        # Cache for storing articles
        self.article_cache = {}
        self.last_update = None
        self.db_path = 'news_cache.db'
        self.init_database()

    def init_database(self):
        """Initialize SQLite database for caching"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS articles (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    source TEXT,
                    category TEXT
                )
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)
            ''')

            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")

    async def fetch_rss_feed(self, session, source_name, source_config):
        """Fetch and parse RSS feed from a single source"""
        try:
            timeout = aiohttp.ClientTimeout(total=30)
            async with session.get(source_config['rss_url'], timeout=timeout) as response:
                if response.status != 200:
                    logger.warning(f"HTTP {response.status} for {source_name}")
                    return []

                content = await response.text()
                feed = feedparser.parse(content)

                if feed.bozo:
                    logger.warning(
                        f"Malformed feed from {source_name}: {feed.bozo_exception}")

                articles = []
                for entry in feed.entries[:10]:  # Limit to 10 most recent
                    try:
                        article = NewsArticle.from_feed_entry(
                            entry, source_config)
                        articles.append(article)
                    except Exception as e:
                        logger.error(
                            f"Error processing entry from {source_name}: {e}")
                        continue

                logger.info(
                    f"Fetched {len(articles)} articles from {source_name}")
                return articles

        except asyncio.TimeoutError:
            logger.error(f"Timeout fetching {source_name}")
            return []
        except Exception as e:
            logger.error(f"Error fetching {source_name}: {e}")
            return []

    async def aggregate_all_sources(self):
        """Aggregate news from all configured sources"""
        start_time = time.time()
        logger.info("Starting news aggregation...")

        all_articles = []

        connector = aiohttp.TCPConnector(limit=10)
        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'Nairobell News Aggregator 1.0'}
        ) as session:
            tasks = [
                self.fetch_rss_feed(session, name, config)
                for name, config in self.news_sources.items()
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    source_name = list(self.news_sources.keys())[i]
                    logger.error(f"Failed to fetch {source_name}: {result}")
                else:
                    all_articles.extend(result)

        # Remove duplicates and sort by recency
        unique_articles = self.deduplicate_articles(all_articles)
        unique_articles.sort(key=lambda x: x.published_at, reverse=True)

        # Cache articles
        self.cache_articles(unique_articles)

        elapsed = time.time() - start_time
        logger.info(
            f"Aggregation completed: {len(unique_articles)} unique articles in {elapsed:.2f}s")

        return unique_articles

    def deduplicate_articles(self, articles):
        """Remove duplicate articles based on title similarity"""
        unique_articles = []
        seen_titles = set()

        for article in articles:
            # Create a normalized title for comparison
            normalized_title = re.sub(
                r'[^\w\s]', '', article.title.lower()).strip()

            # Check for similarity with existing titles
            is_duplicate = False
            for seen_title in seen_titles:
                similarity = self.calculate_similarity(
                    normalized_title, seen_title)
                if similarity > 0.8:  # 80% similarity threshold
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_articles.append(article)
                seen_titles.add(normalized_title)

        return unique_articles

    def calculate_similarity(self, text1, text2):
        """Calculate similarity between two texts"""
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union)

    def cache_articles(self, articles):
        """Cache articles in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            for article in articles:
                cursor.execute('''
                    INSERT OR REPLACE INTO articles (id, data, source, category)
                    VALUES (?, ?, ?, ?)
                ''', (
                    article.id,
                    json.dumps(article.to_dict()),
                    article.source,
                    article.category
                ))

            conn.commit()
            conn.close()
            logger.info(f"Cached {len(articles)} articles to database")
        except Exception as e:
            logger.error(f"Error caching articles: {e}")

    def get_cached_articles(self, max_age_hours=6):
        """Get cached articles from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cutoff_time = datetime.now() - timedelta(hours=max_age_hours)

            cursor.execute('''
                SELECT data FROM articles
                WHERE created_at > ?
                ORDER BY created_at DESC
            ''', (cutoff_time.isoformat(),))

            articles = []
            for row in cursor.fetchall():
                try:
                    article_data = json.loads(row[0])
                    articles.append(article_data)
                except Exception as e:
                    logger.error(f"Error parsing cached article: {e}")

            conn.close()
            logger.info(f"Retrieved {len(articles)} cached articles")
            return articles
        except Exception as e:
            logger.error(f"Error retrieving cached articles: {e}")
            return []

    def export_to_json(self, articles, filename="latest_news.json"):
        """Export articles to JSON file"""
        try:
            output_data = {
                'timestamp': datetime.now().isoformat(),
                'total_articles': len(articles),
                'sources': list(set(article.source for article in articles)),
                'articles': [article.to_dict() for article in articles]
            }

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)

            logger.info(f"Exported {len(articles)} articles to {filename}")
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")

    def get_trending_topics(self, articles, top_n=10):
        """Extract trending topics from articles"""
        topic_counts = {}

        for article in articles:
            # Extract keywords from title and description
            text = f"{article.title} {article.description}".lower()
            words = re.findall(r'\b[a-z]{4,}\b', text)  # Words with 4+ letters

            # Common stop words to ignore
            stop_words = {'news', 'said', 'says', 'after', 'will', 'also', 'been', 'have', 'were', 'this', 'that',
                          'with', 'from', 'they', 'more', 'would', 'could', 'than', 'what', 'when', 'where', 'while', 'about'}

            for word in words:
                if word not in stop_words and len(word) > 3:
                    topic_counts[word] = topic_counts.get(word, 0) + 1

        # Sort by frequency and return top topics
        trending = sorted(topic_counts.items(),
                          key=lambda x: x[1], reverse=True) return trending[:top_n]

    def generate_article_id(self, title: str, url: str) -> str:
        """Generate unique ID for article"""
        content = f"{title}_{url}"
        return hashlib.md5(content.encode()).hexdigest()

    def extract_image_from_content(self, content: str, entry_links: list) -> Optional[str]:
        """Extract image URL from article content or links"""
        # Try to find image in content
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
        img_match = re.search(img_pattern, content, re.IGNORECASE)
        if img_match:
            return img_match.group(1)

        # Try to find image in entry links
        for link in entry_links:
            if hasattr(link, 'type') and link.type and 'image' in link.type:
                return link.href

        return None

    def categorize_article(self, title: str, description: str, source_category: str) -> str:
        """Categorize article based on content"""
        content = f"{title} {description}".lower()

        # Technology keywords
        tech_keywords = ['technology', 'tech', 'digital', 'ai', 'artificial intelligence',
                         'startup', 'fintech', 'mobile', 'internet', 'software', 'app']

        # Business keywords
        business_keywords = ['business', 'economy', 'economic', 'market', 'trade', 'investment',
                             'finance', 'bank', 'money', 'gdp', 'inflation', 'currency']

        # Politics keywords
        politics_keywords = ['politics', 'political', 'government', 'president', 'minister',
                             'election', 'vote', 'parliament', 'policy', 'law', 'constitution']

        # Sports keywords
        sports_keywords = ['sports', 'sport', 'football', 'soccer', 'athletics', 'olympics',
                           'world cup', 'match', 'player', 'team', 'coach', 'tournament']

        # Health keywords
        health_keywords = ['health', 'medical', 'hospital', 'disease', 'vaccine', 'covid',
                           'doctor', 'medicine', 'healthcare', 'pandemic', 'virus']

        # Check categories
        if any(keyword in content for keyword in tech_keywords):
            return 'technology'
        elif any(keyword in content for keyword in business_keywords):
            return 'business'
        elif any(keyword in content for keyword in politics_keywords):
            return 'politics'
        elif any(keyword in content for keyword in sports_keywords):
            return 'sports'
        elif any(keyword in content for keyword in health_keywords):
            return 'health'

        return source_category


async def main():
    """Main aggregation function"""
    aggregator = AfricanNewsAggregator()

    try:
        # Try to get fresh articles
        articles = await aggregator.aggregate_all_sources()

        if not articles:
            logger.warning("No fresh articles found, using cached articles")
            cached_data = aggregator.get_cached_articles()
            if cached_data:
                # Convert cached data back to NewsArticle objects if needed
                articles = cached_data

        if articles:
            # Export to JSON for web app consumption
            aggregator.export_to_json(articles if isinstance(
                articles[0], NewsArticle) else [])

            # Print summary
            if isinstance(articles[0], NewsArticle):
                trending = aggregator.get_trending_topics(articles)
                logger.info("Top trending topics:")
                for topic, count in trending[:5]:
                    logger.info(f"  {topic}: {count} mentions")

            return articles
        else:
            logger.error("No articles available")
            return []

    except Exception as e:
        logger.error(f"Aggregation failed: {e}")
        return []


def run_scheduled_aggregation():
    """Run aggregation on schedule"""
    logger.info("Starting scheduled aggregation...")

    # Schedule aggregation every 30 minutes
    schedule.every(30).minutes.do(lambda: asyncio.run(main()))

    # Initial run
    asyncio.run(main())

    # Keep running scheduled tasks
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        run_scheduled_aggregation()
    else:
        # Run once
        articles = asyncio.run(main())
        print(f"Fetched {len(articles)} articles")
        """Generate unique ID for article"""
        content = f"{title}_{url}"
        return hashlib.md5(content.encode()).hexdigest()

    def extract_image_from_content(self, content: str, entry_links: list) -> Optional[str]:
        """Extract image URL from article content or links"""
        # Try to find image in content
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
        img_match = re.search(img_pattern, content, re.IGNORECASE)
        if img_match:
            return img_match.group(1)

        # Try to find image in entry links
        for link in entry_links:
            if hasattr(link, 'type') and link.type and 'image' in link.type:
                return link.href

        return None

    def categorize_article(self, title: str, description: str, source_category: str) -> str:
        """Categorize article based on content"""
        content = f"{title} {description}".lower()

        # Technology keywords
        tech_keywords = ['technology', 'tech', 'digital', 'ai', 'artificial intelligence',
                         'startup', 'fintech', 'mobile', 'internet', 'software', 'app']

        # Business keywords
        business_keywords = ['business', 'economy', 'economic', 'market', 'trade', 'investment',
                             'finance', 'bank', 'money', 'gdp', 'inflation', 'currency']

        # Politics keywords
        politics_keywords = ['politics', 'political', 'government', 'president', 'minister',
                             'election', 'vote', 'parliament', 'policy', 'law', 'constitution']

        # Sports keywords
        sports_keywords = ['sports', 'sport', 'football', 'soccer', 'athletics', 'olympics',
                           'world cup', 'match', 'player', 'team', 'coach', 'tournament']

        # Health keywords
        health_keywords = ['health', 'medical', 'hospital', 'disease', 'vaccine', 'covid',
                           'doctor', 'medicine', 'healthcare', 'pandemic', 'virus']

        # Check categories
        if any(keyword in content for keyword in tech_keywords):
            return 'technology'
        elif any(keyword in content for keyword in business_keywords):
            return 'business'
        elif any(keyword in content for keyword in politics_keywords):
            return 'politics'
        elif any(keyword in content for keyword in sports_keywords):
            return 'sports'
        elif any(keyword in content for keyword in health_keywords):
            return 'health'

        return source_category

    def determine_country_focus(self, title: str, description: str, source_country: str) -> List[str]:
        """Determine which countries this article focuses on"""
        content = f"{title} {description}".lower()
        countries = []

        # African countries mapping
        country_keywords = {
            'nigeria': ['nigeria', 'nigerian', 'lagos', 'abuja', 'kano'],
            'kenya': ['kenya', 'kenyan', 'nairobi', 'mombasa', 'kisumu'],
            'south-africa': ['south africa', 'south african', 'johannesburg', 'cape town', 'durban', 'pretoria'],
            'ghana': ['ghana', 'ghanaian', 'accra', 'kumasi', 'tamale'],
            'ethiopia': ['ethiopia', 'ethiopian', 'addis ababa', 'dire dawa'],
            'uganda': ['uganda', 'ugandan', 'kampala', 'entebbe'],
            'tanzania': ['tanzania', 'tanzanian', 'dar es salaam', 'dodoma'],
            'egypt': ['egypt', 'egyptian', 'cairo', 'alexandria'],
            'morocco': ['morocco', 'moroccan', 'casablanca', 'rabat', 'marrakech'],
            'tunisia': ['tunisia', 'tunisian', 'tunis'],
            'algeria': ['algeria', 'algerian', 'algiers'],
            'zimbabwe': ['zimbabwe', 'zimbabwean', 'harare', 'bulawayo'],
            'zambia': ['zambia', 'zambian', 'lusaka'],
            'botswana': ['botswana', 'gaborone'],
            'rwanda': ['rwanda', 'rwandan', 'kigali'],
            'senegal': ['senegal', 'senegalese', 'dakar'],
            'ivory-coast': ['ivory coast', 'cote d\'ivoire', 'abidjan', 'yamoussoukro'],
            'cameroon': ['cameroon', 'cameroonian', 'yaounde', 'douala'],
            'mali': ['mali', 'malian', 'bamako'],
            'burkina-faso': ['burkina faso', 'ouagadougou'],
            'niger': ['niger', 'niamey'],
            'chad': ['chad', 'chadian', 'n\'djamena'],
            'sudan': ['sudan', 'sudanese', 'khartoum'],
            'south-sudan': ['south sudan', 'juba'],
            'somalia': ['somalia', 'somali', 'mogadishu'],
            'djibouti': ['djibouti'],
            'eritrea': ['eritrea', 'eritrean', 'asmara'],
            'libya': ['libya', 'libyan', 'tripoli', 'benghazi'],
            'madagascar': ['madagascar', 'antananarivo'],
            'mauritius': ['mauritius', 'port louis'],
            'seychelles': ['seychelles', 'victoria'],
            'comoros': ['comoros', 'moroni'],
            'cape-verde': ['cape verde', 'praia'],
            'sao-tome': ['sao tome', 'principe'],
            'equatorial-guinea': ['equatorial guinea', 'malabo'],
            'gabon': ['gabon', 'libreville'],
            'republic-congo': ['republic of congo', 'brazzaville'],
            'drc': ['democratic republic', 'drc', 'congo', 'kinshasa'],
            'car': ['central african republic', 'bangui'],
            'angola': ['angola', 'angolan', 'luanda'],
            'namibia': ['namibia', 'namibian', 'windhoek'],
            'lesotho': ['lesotho', 'maseru'],
            'swaziland': ['swaziland', 'eswatini', 'mbabane'],
            'malawi': ['malawi', 'malawian', 'lilongwe', 'blantyre'],
            'mozambique': ['mozambique', 'mozambican', 'maputo'],
            'liberia': ['liberia', 'liberian', 'monrovia'],
            'sierra-leone': ['sierra leone', 'freetown'],
            'guinea': ['guinea', 'conakry'],
            'guinea-bissau': ['guinea-bissau', 'bissau'],
            'gambia': ['gambia', 'banjul'],
            'benin': ['benin', 'porto-novo', 'cotonou'],
            'togo': ['togo', 'lome']
        }

        # Check for country mentions
        for country, keywords in country_keywords.items():
            if any(keyword in content for keyword in keywords):
                countries.append(country)

        # If no specific countries found, use source country
        if not countries and source_country != 'international':
            countries.append(source_country)

        # If still no countries and it's international, add major African countries
        if not countries and source_country == 'international':
            countries = ['nigeria', 'kenya',
                         'south-africa', 'ghana', 'ethiopia']

        return countries

    def calculate_engagement_score(self, title: str, description: str, is_breaking: bool) -> float:
        """Calculate engagement score based on content analysis"""
        score = 5.0  # Base score

        # Breaking news gets higher score
        if is_breaking:
            score += 2.0

        # Check for engagement indicators
        engagement_words = ['breaking', 'urgent', 'exclusive', 'major', 'significant',
                            'important', 'crisis', 'emergency', 'historic', 'unprecedented']

        content = f"{title} {description}".lower()
        for word in engagement_words:
            if word in content:
                score += 0.5

        # Title length optimization (not too short, not too long)
        title_len = len(title)
        if 30 <= title_len <= 80:
            score += 0.5

        return min(score, 10.0)  # Cap at 10.0

    def is_breaking_news(self, title: str, description: str) -> bool:
        """Determine if article is breaking news"""
        content = f"{title} {description}".lower()
        breaking_indicators = ['breaking', 'urgent', 'just in', 'developing', 'live',
                               'emergency', 'crisis', 'attack', 'explosion', 'death']

        return any(indicator in content for indicator in breaking_indicators)

    async def fetch_rss_feed(self, source_id: str, source_info: Dict) -> List[NewsArticle]:
        """Fetch and parse RSS feed from a source"""
        articles = []

        try:
            logger.info(f"Fetching RSS feed from {source_info['name']}")

            async with self.session.get(source_info['rss_url']) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)

                    # Limit to 10 articles per source
                    for entry in feed.entries[:10]:
                        try:
                            # Extract basic info
                            title = entry.get('title', '').strip()
                            description = entry.get('description', '').strip()
                            url = entry.get('link', '')

                            if not title or not url:
                                continue

                            # Parse published date
                            published_at = datetime.now()
                            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                                try:
                                    published_at = datetime(
                                        *entry.published_parsed[:6])
                                except:
                                    pass

                            # Extract thumbnail
                            thumbnail = None
                            if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
                                thumbnail = entry.media_thumbnail[0]['url']
                            elif hasattr(entry, 'enclosures') and entry.enclosures:
                                for enclosure in entry.enclosures:
                                    if 'image' in enclosure.get('type', ''):
                                        thumbnail = enclosure.get('href')
                                        break

                            if not thumbnail:
                                thumbnail = self.extract_image_from_content(
                                    entry.get('content', [{}])[0].get(
                                        'value', '') if entry.get('content') else '',
                                    entry.get('links', [])
                                )

                            # Determine article properties
                            category = self.categorize_article(
                                title, description, source_info['category'])
                            country_focus = self.determine_country_focus(
                                title, description, source_info['country'])
                            is_breaking = self.is_breaking_news(
                                title, description)
                            engagement_score = self.calculate_engagement_score(
                                title, description, is_breaking)

                            # Create article
                            article = NewsArticle(
                                id=self.generate_article_id(title, url),
                                title=title,
                                description=description,
                                content=entry.get('content', [{}])[0].get(
                                    'value', description) if entry.get('content') else description,
                                url=url,
                                thumbnail=thumbnail,
                                source=source_info['name'],
                                category=category,
                                country_focus=country_focus,
                                language=source_info['language'],
                                published_at=published_at,
                                is_breaking=is_breaking,
                                is_trending=engagement_score > 7.0,
                                engagement_score=engagement_score,
                                credibility_score=source_info['credibility']
                            )

                            articles.append(article)

                        except Exception as e:
                            logger.error(
                                f"Error processing entry from {source_info['name']}: {e}")
                            continue

                else:
                    logger.warning(
                        f"Failed to fetch {source_info['name']}: HTTP {response.status}")

        except Exception as e:
            logger.error(
                f"Error fetching RSS feed from {source_info['name']}: {e}")

        return articles

    async def fetch_news_api(self) -> List[NewsArticle]:
        """Fetch news from NewsAPI as fallback"""
        articles = []

        if not self.news_apis['newsapi']['key']:
            logger.warning("NewsAPI key not provided")
            return articles

        try:
            params = {
                'q': 'Africa OR Nigeria OR Kenya OR "South Africa" OR Ghana OR Ethiopia',
                'sortBy': 'publishedAt',
                'language': 'en',
                'pageSize': 50,
                'apiKey': self.news_apis['newsapi']['key']
            }

            async with self.session.get(self.news_apis['newsapi']['url'], params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    for item in data.get('articles', []):
                        try:
                            title = item.get('title', '').strip()
                            description = item.get('description', '').strip()
                            url = item.get('url', '')

                            if not title or not url or title == '[Removed]':
                                continue

                            # Parse published date
                            published_at = datetime.now()
                            if item.get('publishedAt'):
                                try:
                                    published_at = datetime.fromisoformat(
                                        item['publishedAt'].replace(
                                            'Z', '+00:00')
                                    )
                                except:
                                    pass

                            # Determine article properties
                            category = self.categorize_article(
                                title, description, 'general')
                            country_focus = self.determine_country_focus(
                                title, description, 'international')
                            is_breaking = self.is_breaking_news(
                                title, description)
                            engagement_score = self.calculate_engagement_score(
                                title, description, is_breaking)

                            article = NewsArticle(
                                id=self.generate_article_id(title, url),
                                title=title,
                                description=description,
                                content=item.get('content', description),
                                url=url,
                                thumbnail=item.get('urlToImage'),
                                source=item.get('source', {}).get(
                                    'name', 'NewsAPI'),
                                category=category,
                                country_focus=country_focus,
                                language='en',
                                published_at=published_at,
                                is_breaking=is_breaking,
                                is_trending=engagement_score > 7.0,
                                engagement_score=engagement_score,
                                credibility_score=7.0
                            )

                            articles.append(article)

                        except Exception as e:
                            logger.error(
                                f"Error processing NewsAPI article: {e}")
                            continue

        except Exception as e:
            logger.error(f"Error fetching from NewsAPI: {e}")

        return articles

    async def fetch_gnews_api(self) -> List[NewsArticle]:
        """Fetch news from GNews API"""
        articles = []

        if not self.news_apis['gnews']['key']:
            logger.warning("GNews API key not provided")
            return articles

        try:
            params = {
                'q': 'Africa OR Nigeria OR Kenya OR "South Africa" OR Ghana OR Ethiopia',
                'sort': 'publishedAt',
                'lang': 'en',
                'limit': 50,
                'apikey': self.news_apis['gnews']['key']
            }

            async with self.session.get(self.news_apis['gnews']['url'], params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    for item in data.get('articles', []):
                        try:
                            title = item.get('title', '').strip()
                            description = item.get('description', '').strip()
                            url = item.get('url', '')

                            if not title or not url:
                                continue

                            # Parse published date
                            published_at = datetime.now()
                            if item.get('publishedAt'):
                                try:
                                    published_at = datetime.fromisoformat(
                                        item['publishedAt'].replace(
                                            'Z', '+00:00')
                                    )
                                except:
                                    pass

                            # Extract thumbnail from image
                            thumbnail = item.get('image', None)

                            # Determine article properties
                            category = self.categorize_article(
                                title, description, 'general')
                            country_focus = self.determine_country_focus(
                                title, description, 'international')
                            is_breaking = self.is_breaking_news(
                                title, description)
                            engagement_score = self.calculate_engagement_score(
                                title, description, is_breaking)

                            article = NewsArticle(
                                id=self.generate_article_id(title, url),
                                title=title,
                                description=description,
                                content=item.get('content', description),
                                url=url,
                                thumbnail=thumbnail,
                                source=item.get('source', {}).get(
                                    'name', 'GNews'),
                                category=category,
                                country_focus=country_focus,
                                language='en',
                                published_at=published_at,
                                is_breaking=is_breaking,
                                is_trending=engagement_score > 7.0,
                                engagement_score=engagement_score,
                                credibility_score=7.0
                            )

                            articles.append(article)

                        except Exception as e:
                            logger.error(
                                f"Error processing GNews article: {e}")
                            continue

        except Exception as e:
            logger.error(f"Error fetching from GNews API: {e}")

        return articles

    async def aggregate_all_news(self) -> List[NewsArticle]:
        """Aggregate news from all sources"""
        all_articles = []

        # Fetch from RSS feeds
        tasks = []
        for source_id, source_info in self.news_sources.items():
            task = self.fetch_rss_feed(source_id, source_info)
            tasks.append(task)

        rss_results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in rss_results:
            if isinstance(result, list):
                all_articles.extend(result)
            else:
                logger.error(f"RSS fetch failed: {result}")

        # Fetch from NewsAPI as fallback
        try:
            api_articles = await self.fetch_news_api()
            all_articles.extend(api_articles)
        except Exception as e:
            logger.error(f"NewsAPI fetch failed: {e}")

        # Fetch from GNews API as additional source
        try:
            gnews_articles = await self.fetch_gnews_api()
            all_articles.extend(gnews_articles)
        except Exception as e:
            logger.error(f"GNews API fetch failed: {e}")

        # Remove duplicates based on title similarity
        unique_articles = self.remove_duplicates(all_articles)

        # Sort by engagement score and recency
        unique_articles.sort(
            key=lambda x: (x.engagement_score, x.published_at),
            reverse=True
        )

        logger.info(
            f"Aggregated {len(unique_articles)} unique articles from {len(self.news_sources)} sources")

        self.articles_cache = unique_articles
        return unique_articles

    def remove_duplicates(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Remove duplicate articles based on title similarity"""
        unique_articles = []
        seen_titles = set()

        for article in articles:
            # Create a normalized title for comparison
            normalized_title = re.sub(
                r'[^\w\s]', '', article.title.lower()).strip()
            normalized_title = ' '.join(normalized_title.split())

            # Check if we've seen a similar title
            is_duplicate = False
            for seen_title in seen_titles:
                # Calculate similarity (simple word overlap)
                words1 = set(normalized_title.split())
                words2 = set(seen_title.split())

                if len(words1) > 0 and len(words2) > 0:
                    overlap = len(words1.intersection(words2))
                    similarity = overlap / max(len(words1), len(words2))

                    if similarity > 0.8:  # 80% similarity threshold
                        is_duplicate = True
                        break

            if not is_duplicate:
                unique_articles.append(article)
                seen_titles.add(normalized_title)

        return unique_articles

    def export_to_json(self, articles: List[NewsArticle], filename: str = None) -> str:
        """Export articles to JSON format"""
        if filename is None:
            filename = f"african_news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        articles_data = []
        for article in articles:
            articles_data.append({
                'id': article.id,
                'title': article.title,
                'description': article.description,
                'content': article.content,
                'url': article.url,
                'thumbnail': article.thumbnail,
                'source': article.source,
                'category': article.category,
                'country_focus': article.country_focus,
                'language': article.language,
                'published_at': article.published_at.isoformat(),
                'is_breaking': article.is_breaking,
                'is_trending': article.is_trending,
                'engagement_score': article.engagement_score,
                'credibility_score': article.credibility_score
            })

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_articles': len(articles_data),
                'articles': articles_data
            }, f, indent=2, ensure_ascii=False)

        return filename


async def main():
    """Main function for testing the aggregator"""
    async with AfricanNewsAggregator() as aggregator:
        articles = await aggregator.aggregate_all_news()

        if articles:
            filename = aggregator.export_to_json(articles)
            print(f"Exported {len(articles)} articles to {filename}")

            # Print summary
            print(f"\nSummary:")
            print(f"Total articles: {len(articles)}")
            print(
                f"Breaking news: {len([a for a in articles if a.is_breaking])}")
            print(f"Trending: {len([a for a in articles if a.is_trending])}")

            # Category breakdown
            categories = {}
            for article in articles:
                categories[article.category] = categories.get(
                    article.category, 0) + 1

            print(f"\nCategories:")
            for category, count in sorted(categories.items()):
                print(f"  {category}: {count}")

            # Country breakdown
            countries = {}
            for article in articles:
                for country in article.country_focus:
                    countries[country] = countries.get(country, 0) + 1

            print(f"\nTop countries:")
            for country, count in sorted(countries.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {country}: {count}")
        else:
            print("No articles fetched")

if __name__ == "__main__":
    asyncio.run(main())

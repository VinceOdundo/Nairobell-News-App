#!/usr/bin/env python3
"""
African News Aggregation Service
Real-time news aggregation from multiple African and international sources
Enhanced for production use with better error handling and caching
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
            },
            # Other notable sources
            'new_vision_uganda': {
                'name': 'New Vision Uganda',
                'rss_url': 'https://www.newvision.co.ug/rss/homepage',
                'website': 'https://www.newvision.co.ug/',
                'country': 'uganda',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'ethiopia_reporter': {
                'name': 'The Ethiopian Reporter',
                'rss_url': 'https://www.ethiopianreporter.com/feed/',
                'website': 'https://www.ethiopianreporter.com/',
                'country': 'ethiopia',
                'language': 'en',
                'category': 'general',
                'credibility': 6.5
            },
            'punch_nigeria': {
                'name': 'The Punch Nigeria',
                'rss_url': 'https://punchng.com/feed/',
                'website': 'https://punchng.com/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
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
            'techpoint_africa': {
                'name': 'TechPoint Africa',
                'rss_url': 'https://techpoint.africa/feed/',
                'website': 'https://techpoint.africa/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'technology',
                'credibility': 7.5
            },
            'graphic_ghana': {
                'name': 'Daily Graphic Ghana',
                'rss_url': 'https://www.graphic.com.gh/rss/news.xml',
                'website': 'https://www.graphic.com.gh/',
                'country': 'ghana',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'news24_south_africa': {
                'name': 'News24 South Africa',
                'rss_url': 'https://feeds.news24.com/articles/news24/rss',
                'website': 'https://www.news24.com/',
                'country': 'south-africa',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'iol_south_africa': {
                'name': 'IOL South Africa',
                'rss_url': 'https://www.iol.co.za/cmlink/1.1304304',
                'website': 'https://www.iol.co.za/',
                'country': 'south-africa',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'herald_zimbabwe': {
                'name': 'The Herald Zimbabwe',
                'rss_url': 'https://www.herald.co.zw/feed/',
                'website': 'https://www.herald.co.zw/',
                'country': 'zimbabwe',
                'language': 'en',
                'category': 'general',
                'credibility': 6.0
            },
            'al_ahram_egypt': {
                'name': 'Al-Ahram Egypt',
                'rss_url': 'http://english.ahram.org.eg/rss/news.xml',
                'website': 'http://english.ahram.org.eg/',
                'country': 'egypt',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'morocco_world_news': {
                'name': 'Morocco World News',
                'rss_url': 'https://www.moroccoworldnews.com/feed/',
                'website': 'https://www.moroccoworldnews.com/',
                'country': 'morocco',
                'language': 'en',
                'category': 'general',
                'credibility': 6.5
            },
            'african_business': {
                'name': 'African Business',
                'rss_url': 'https://african.business/feed',
                'website': 'https://african.business/',
                'country': 'international',
                'language': 'en',
                'category': 'business',
                'credibility': 8.0
            },
            'afronews': {
                'name': 'Africanews',
                'rss_url': 'https://www.africanews.com/api/en/rss',
                'website': 'https://www.africanews.com/',
                'country': 'international',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'the_guardian_nigeria': {
                'name': 'The Guardian Nigeria',
                'rss_url': 'https://guardian.ng/feed/',
                'website': 'https://guardian.ng/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'daily_post_nigeria': {
                'name': 'Daily Post Nigeria',
                'rss_url': 'https://dailypost.ng/feed/',
                'website': 'https://dailypost.ng/',
                'country': 'nigeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'kenya_news_agency': {
                'name': 'Kenya News Agency',
                'rss_url': 'https://www.kenyanews.go.ke/feed/',
                'website': 'https://www.kenyanews.go.ke/',
                'country': 'kenya',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'kenyans_co_ke': {
                'name': 'Kenyans.co.ke',
                'rss_url': 'https://www.kenyans.co.ke/feeds/news?_wrapper_format=html',
                'website': 'https://www.kenyans.co.ke/',
                'country': 'kenya',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'mail_and_guardian': {
                'name': 'Mail & Guardian',
                'rss_url': 'https://mg.co.za/feed/',
                'website': 'https://mg.co.za/',
                'country': 'south-africa',
                'language': 'en',
                'category': 'general',
                'credibility': 8.0
            },
            'daily_maverick': {
                'name': 'Daily Maverick',
                'rss_url': 'https://www.dailymaverick.co.za/dmrss/',
                'website': 'https://www.dailymaverick.co.za/',
                'country': 'south-africa',
                'language': 'en',
                'category': 'general',
                'credibility': 8.0
            },
            'egypt_independent': {
                'name': 'Egypt Independent',
                'rss_url': 'https://www.egyptindependent.com/feed/',
                'website': 'https://www.egyptindependent.com/',
                'country': 'egypt',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'daily_news_egypt': {
                'name': 'Daily News Egypt',
                'rss_url': 'https://www.dailynewsegypt.com/feed/',
                'website': 'https://www.dailynewsegypt.com/',
                'country': 'egypt',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'ghanaian_times': {
                'name': 'Ghanaian Times',
                'rss_url': 'https://ghanaiantimes.com.gh/feed/',
                'website': 'https://ghanaiantimes.com.gh/',
                'country': 'ghana',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'capital_ethiopia': {
                'name': 'Capital Ethiopia',
                'rss_url': 'https://capitalethiopia.com/feed/',
                'website': 'https://capitalethiopia.com/',
                'country': 'ethiopia',
                'language': 'en',
                'category': 'business',
                'credibility': 7.0
            },
            'daily_monitor_uganda': {
                'name': 'Daily Monitor',
                'rss_url': 'https://www.monitor.co.ug/uganda?view=rssticker',
                'website': 'https://www.monitor.co.ug/',
                'country': 'uganda',
                'language': 'en',
                'category': 'general',
                'credibility': 7.5
            },
            'zimbabwe_mail': {
                'name': 'The Zimbabwe Mail',
                'rss_url': 'https://www.thezimbabwemail.com/feed/',
                'website': 'https://www.thezimbabwemail.com/',
                'country': 'zimbabwe',
                'language': 'en',
                'category': 'general',
                'credibility': 6.5
            },
            'the_citizen_tz': {
                'name': 'The Citizen',
                'rss_url': 'https://www.thecitizen.co.tz/tanzania?view=rssticker',
                'website': 'https://www.thecitizen.co.tz/',
                'country': 'tanzania',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'new_times_rwanda': {
                'name': 'The New Times',
                'rss_url': 'https://www.newtimes.co.rw/rss/all',
                'website': 'https://www.newtimes.co.rw/',
                'country': 'rwanda',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'seneweb_senegal': {
                'name': 'Seneweb',
                'rss_url': 'https://www.seneweb.com/news/rss.php',
                'website': 'https://www.seneweb.com/',
                'country': 'senegal',
                'language': 'fr',
                'category': 'general',
                'credibility': 6.5
            },
            'abidjan_net': {
                'name': 'Abidjan.net',
                'rss_url': 'https://news.abidjan.net/rss.xml',
                'website': 'https://news.abidjan.net/',
                'country': 'ivory-coast',
                'language': 'fr',
                'category': 'general',
                'credibility': 7.0
            },
            'algeria_press_service': {
                'name': 'Algeria Press Service',
                'rss_url': 'https://www.aps.dz/en?format=feed&type=rss',
                'website': 'https://www.aps.dz/en',
                'country': 'algeria',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'tunis_afrique_presse': {
                'name': 'Tunis Afrique Presse',
                'rss_url': 'https://www.tap.info.tn/en?format=feed&type=rss',
                'website': 'https://www.tap.info.tn/en',
                'country': 'tunisia',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
            },
            'angola_press_agency': {
                'name': 'Angola Press Agency',
                'rss_url': 'https://www.angop.ao/angop/en/noticias.rss',
                'website': 'https://www.angop.ao/en',
                'country': 'angola',
                'language': 'en',
                'category': 'general',
                'credibility': 7.0
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
                          key=lambda x: x[1], reverse=True)
        return trending[:top_n]


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
            if articles and isinstance(articles[0], NewsArticle):
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
        print(f"Successfully aggregated {len(articles)} articles")

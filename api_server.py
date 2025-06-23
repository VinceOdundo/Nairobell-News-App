#!/usr/bin/env python3
"""
Simple API server to serve aggregated news data to the React frontend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
import logging
from news_aggregator import AfricanNewsAggregator
import asyncio
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global aggregator instance
aggregator = AfricanNewsAggregator()
news_cache = {
    'articles': [],
    'last_updated': None,
    'trending_topics': []
}


def update_news_cache():
    """Update news cache in background"""
    global news_cache
    try:
        logger.info("Updating news cache...")

        # Try to load from file first (if aggregator has run recently)
        if os.path.exists('latest_news.json'):
            with open('latest_news.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                news_cache['articles'] = data.get('articles', [])
                news_cache['last_updated'] = datetime.now().isoformat()
                logger.info(
                    f"Loaded {len(news_cache['articles'])} articles from cache file")
                return

        # If no cache file, try to aggregate fresh data
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        articles = loop.run_until_complete(aggregator.aggregate_all_sources())

        if articles:
            news_cache['articles'] = [article.to_dict()
                                      for article in articles]
            news_cache['trending_topics'] = aggregator.get_trending_topics(
                articles)
        else:
            # Fallback to cached articles from database
            cached_articles = aggregator.get_cached_articles()
            news_cache['articles'] = cached_articles

        news_cache['last_updated'] = datetime.now().isoformat()
        logger.info(
            f"Updated cache with {len(news_cache['articles'])} articles")

    except Exception as e:
        logger.error(f"Error updating news cache: {e}")


def periodic_update():
    """Periodically update news cache"""
    while True:
        update_news_cache()
        time.sleep(1800)  # Update every 30 minutes


# Start background update thread
update_thread = threading.Thread(target=periodic_update, daemon=True)
update_thread.start()


@app.route('/api/news', methods=['GET'])
def get_news():
    """Get latest news articles"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        category = request.args.get('category', '')
        country = request.args.get('country', '')
        search = request.args.get('search', '')

        # Filter articles
        articles = news_cache['articles']

        if category:
            articles = [a for a in articles if a.get(
                'category', '').lower() == category.lower()]

        if country:
            articles = [a for a in articles if country.lower(
            ) in [c.lower() for c in a.get('country_focus', [])]]

        if search:
            search_lower = search.lower()
            articles = [a for a in articles if
                        search_lower in a.get('title', '').lower() or
                        search_lower in a.get('description', '').lower()]

        # Pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_articles = articles[start_idx:end_idx]

        return jsonify({
            'success': True,
            'articles': paginated_articles,
            'total': len(articles),
            'page': page,
            'limit': limit,
            'has_more': end_idx < len(articles),
            'last_updated': news_cache['last_updated']
        })

    except Exception as e:
        logger.error(f"Error serving news: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'articles': []
        }), 500


@app.route('/api/trending', methods=['GET'])
def get_trending():
    """Get trending topics"""
    try:
        return jsonify({
            'success': True,
            'trending_topics': news_cache['trending_topics'][:10],
            'last_updated': news_cache['last_updated']
        })
    except Exception as e:
        logger.error(f"Error serving trending topics: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'trending_topics': []
        }), 500


@app.route('/api/sources', methods=['GET'])
def get_sources():
    """Get available news sources"""
    try:
        sources = []
        for name, config in aggregator.news_sources.items():
            sources.append({
                'id': name,
                'name': config['name'],
                'country': config['country'],
                'language': config['language'],
                'category': config['category'],
                'credibility': config['credibility']
            })

        return jsonify({
            'success': True,
            'sources': sources
        })
    except Exception as e:
        logger.error(f"Error serving sources: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'sources': []
        }), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get available categories"""
    try:
        categories = list(set(a.get('category', 'general')
                          for a in news_cache['articles']))
        return jsonify({
            'success': True,
            'categories': sorted(categories)
        })
    except Exception as e:
        logger.error(f"Error serving categories: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'categories': []
        }), 500


@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Get available countries"""
    try:
        countries = set()
        for article in news_cache['articles']:
            countries.update(article.get('country_focus', []))

        return jsonify({
            'success': True,
            'countries': sorted(list(countries))
        })
    except Exception as e:
        logger.error(f"Error serving countries: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'countries': []
        }), 500


@app.route('/api/refresh', methods=['POST'])
def refresh_news():
    """Manually refresh news cache"""
    try:
        update_news_cache()
        return jsonify({
            'success': True,
            'message': 'News cache refreshed',
            'articles_count': len(news_cache['articles']),
            'last_updated': news_cache['last_updated']
        })
    except Exception as e:
        logger.error(f"Error refreshing news: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'articles_cached': len(news_cache['articles']),
        'last_updated': news_cache['last_updated'],
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    # Initial cache update
    update_news_cache()

    # Run the server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    logger.info(f"Starting API server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

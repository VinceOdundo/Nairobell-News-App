#!/usr/bin/env python3
"""
News API Server
FastAPI server to serve aggregated news data to the React frontend
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional
import sqlite3
import asyncio
from news_aggregator_clean import AfricanNewsAggregator
import uvicorn

app = FastAPI(
    title="Nairobell News API",
    description="African News Aggregation API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://localhost:5173", "*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global aggregator instance
aggregator = None


@app.on_event("startup")
async def startup_event():
    """Initialize the news aggregator on startup"""
    global aggregator
    aggregator = AfricanNewsAggregator()

    # Run initial aggregation
    try:
        await aggregator.aggregate_all_sources()
    except Exception as e:
        print(f"Initial aggregation failed: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nairobell News API",
        "version": "1.0.0",
        "endpoints": [
            "/news/latest",
            "/news/by-country/{country}",
            "/news/by-category/{category}",
            "/news/trending",
            "/health"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "news-api"
    }


@app.get("/news/latest")
async def get_latest_news(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    language: Optional[str] = Query("en")
):
    """Get latest news articles"""
    try:
        # Try to get fresh articles first
        articles = await aggregator.aggregate_all_sources()

        # If no fresh articles, get cached ones
        if not articles:
            cached_articles = aggregator.get_cached_articles()
            if cached_articles:
                articles = cached_articles

        if not articles:
            return JSONResponse(
                status_code=404,
                content={"message": "No articles found"}
            )

        # Filter by category if specified
        if category:
            articles = [a for a in articles if a.category.lower() ==
                        category.lower()]

        # Filter by country if specified
        if country:
            articles = [a for a in articles if country.lower() in [c.lower()
                                                                   for c in a.country_focus]]

        # Apply pagination
        total = len(articles)
        articles = articles[offset:offset + limit]

        # Convert to dict format if needed
        article_data = []
        for article in articles:
            if hasattr(article, 'to_dict'):
                article_data.append(article.to_dict())
            else:
                article_data.append(article)

        return {
            "articles": article_data,
            "total": total,
            "limit": limit,
            "offset": offset,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching news: {str(e)}")


@app.get("/news/by-country/{country}")
async def get_news_by_country(
    country: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get news articles for a specific country"""
    return await get_latest_news(limit=limit, offset=offset, country=country)


@app.get("/news/by-category/{category}")
async def get_news_by_category(
    category: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get news articles for a specific category"""
    return await get_latest_news(limit=limit, offset=offset, category=category)


@app.get("/news/trending")
async def get_trending_news(
    limit: int = Query(10, ge=1, le=50)
):
    """Get trending news articles"""
    try:
        articles = await aggregator.aggregate_all_sources()

        if not articles:
            cached_articles = aggregator.get_cached_articles()
            if cached_articles:
                articles = cached_articles

        if not articles:
            return JSONResponse(
                status_code=404,
                content={"message": "No trending articles found"}
            )

        # Filter for trending articles or high engagement
        trending_articles = []
        for article in articles:
            if hasattr(article, 'is_trending') and article.is_trending:
                trending_articles.append(article)
            elif hasattr(article, 'engagement_score') and article.engagement_score > 7.0:
                trending_articles.append(article)

        # If no specific trending articles, get most recent
        if not trending_articles:
            trending_articles = articles[:limit]
        else:
            trending_articles = trending_articles[:limit]

        # Convert to dict format
        article_data = []
        for article in trending_articles:
            if hasattr(article, 'to_dict'):
                article_data.append(article.to_dict())
            else:
                article_data.append(article)

        return {
            "articles": article_data,
            "total": len(trending_articles),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching trending news: {str(e)}")


@app.get("/news/sources")
async def get_news_sources():
    """Get available news sources"""
    try:
        sources = []
        for source_id, source_info in aggregator.news_sources.items():
            sources.append({
                "id": source_id,
                "name": source_info["name"],
                "country": source_info["country"],
                "language": source_info["language"],
                "category": source_info["category"],
                "credibility": source_info["credibility"],
                "website": source_info.get("website", "")
            })

        return {
            "sources": sources,
            "total": len(sources)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching sources: {str(e)}")


@app.post("/news/refresh")
async def refresh_news():
    """Manually trigger news refresh"""
    try:
        articles = await aggregator.aggregate_all_sources()

        return {
            "message": "News refresh completed",
            "articles_fetched": len(articles),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error refreshing news: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "news_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=True
    )

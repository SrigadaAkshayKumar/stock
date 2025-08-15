"""
Enhanced Service module for AI-powered news sentiment analysis.

Provides functionality for:
- Advanced sentiment analysis using TextBlob with financial context
- Enhanced sentiment metrics and confidence scoring
- Financial-specific keyword analysis
- Detailed sentiment breakdowns
"""

import requests
import os
from textblob import TextBlob
import numpy as np
from typing import Dict, List, Tuple
import logging
import re

class EnhancedSentimentAnalyzer:
    def __init__(self):
        """Initialize the enhanced sentiment analyzer with TextBlob and financial context."""
        self.analyzer = TextBlob
        self.financial_keywords = {
            'positive': [
                'growth', 'profit', 'revenue', 'increase', 'strong', 'positive', 'bullish',
                'outperform', 'beat', 'exceed', 'surge', 'rally', 'gain', 'rise', 'up',
                'success', 'win', 'opportunity', 'expansion', 'innovation', 'breakthrough'
            ],
            'negative': [
                'loss', 'decline', 'drop', 'fall', 'bearish', 'negative', 'weak', 'poor',
                'underperform', 'miss', 'decrease', 'crash', 'plunge', 'downturn', 'risk',
                'failure', 'problem', 'issue', 'concern', 'worry', 'threat', 'challenge'
            ],
            'neutral': [
                'announce', 'report', 'release', 'statement', 'comment', 'note', 'update',
                'maintain', 'hold', 'stable', 'steady', 'consistent', 'regular', 'routine'
            ]
        }
        logging.info("Enhanced sentiment analyzer initialized with financial context")
    
    def analyze_text_sentiment(self, text: str) -> Dict:
        """
        Enhanced sentiment analysis with financial context and confidence scoring.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict: Enhanced sentiment analysis results
        """
        if not text or len(text.strip()) < 10:
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "score": 0.0,
                "label": "neutral",
                "financial_context": 0.0,
                "keyword_matches": 0
            }
        
        try:
            # Use TextBlob for base sentiment analysis
            blob = self.analyzer(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Analyze financial context
            financial_context = self._analyze_financial_context(text.lower())
            
            # Combine base sentiment with financial context
            adjusted_polarity = self._adjust_polarity_with_context(polarity, financial_context)
            
            # Determine sentiment based on adjusted polarity
            if adjusted_polarity > 0.1:
                sentiment = "positive"
                confidence = min(abs(adjusted_polarity) + 0.2, 1.0)
            elif adjusted_polarity < -0.1:
                sentiment = "negative"
                confidence = min(abs(adjusted_polarity) + 0.2, 1.0)
            else:
                sentiment = "neutral"
                confidence = 0.5
            
            # Calculate keyword matches
            keyword_matches = self._count_keyword_matches(text.lower())
            
            return {
                "sentiment": sentiment,
                "confidence": round(confidence, 3),
                "score": round(adjusted_polarity, 3),
                "label": sentiment,
                "financial_context": round(financial_context, 3),
                "keyword_matches": keyword_matches,
                "base_polarity": round(polarity, 3),
                "subjectivity": round(subjectivity, 3)
            }
                
        except Exception as e:
            logging.error(f"Error in enhanced sentiment analysis: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "score": 0.0,
                "label": "neutral",
                "financial_context": 0.0,
                "keyword_matches": 0
            }
    
    def _analyze_financial_context(self, text: str) -> float:
        """
        Analyze financial context of the text using keyword analysis.
        
        Args:
            text (str): Lowercase text to analyze
            
        Returns:
            float: Financial context score (-1 to 1)
        """
        positive_count = sum(1 for word in self.financial_keywords['positive'] if word in text)
        negative_count = sum(1 for word in self.financial_keywords['negative'] if word in text)
        neutral_count = sum(1 for word in self.financial_keywords['neutral'] if word in text)
        
        total_keywords = positive_count + negative_count + neutral_count
        
        if total_keywords == 0:
            return 0.0
        
        # Calculate weighted score
        score = (positive_count - negative_count) / total_keywords
        
        # Normalize to -1 to 1 range
        return np.clip(score, -1.0, 1.0)
    
    def _adjust_polarity_with_context(self, base_polarity: float, financial_context: float) -> float:
        """
        Adjust base polarity using financial context.
        
        Args:
            base_polarity (float): Base TextBlob polarity
            financial_context (float): Financial context score
            
        Returns:
            float: Adjusted polarity
        """
        # Weight: 70% base polarity, 30% financial context
        adjusted = (0.7 * base_polarity) + (0.3 * financial_context)
        return np.clip(adjusted, -1.0, 1.0)
    
    def _count_keyword_matches(self, text: str) -> Dict[str, int]:
        """
        Count keyword matches for each sentiment category.
        
        Args:
            text (str): Lowercase text to analyze
            
        Returns:
            Dict: Count of keyword matches
        """
        return {
            'positive': sum(1 for word in self.financial_keywords['positive'] if word in text),
            'negative': sum(1 for word in self.financial_keywords['negative'] if word in text),
            'neutral': sum(1 for word in self.financial_keywords['neutral'] if word in text)
        }
    
    def analyze_news_articles(self, articles: List[Dict]) -> Tuple[List[Dict], Dict]:
        """
        Enhanced analysis of news articles with detailed sentiment metrics.
        
        Args:
            articles (List[Dict]): List of news article dictionaries
            
        Returns:
            Tuple[List[Dict], Dict]: Analyzed articles and enhanced sentiment summary
        """
        if not articles:
            return [], self._get_empty_sentiment_summary()
        
        analyzed_articles = []
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        total_scores = []
        confidence_scores = []
        financial_context_scores = []
        keyword_totals = {"positive": 0, "negative": 0, "neutral": 0}
        
        for article in articles:
            # Combine title and description for analysis
            text_to_analyze = ""
            if article.get('title'):
                text_to_analyze += article['title'] + ". "
            if article.get('description'):
                text_to_analyze += article['description']
            
            # Analyze sentiment with enhanced features
            sentiment_result = self.analyze_text_sentiment(text_to_analyze)
            
            # Add enhanced sentiment info to article
            article_with_sentiment = {
                **article,
                "sentiment": sentiment_result["sentiment"],
                "sentiment_confidence": sentiment_result["confidence"],
                "sentiment_score": sentiment_result["score"],
                "financial_context": sentiment_result["financial_context"],
                "keyword_matches": sentiment_result["keyword_matches"],
                "base_polarity": sentiment_result["base_polarity"],
                "subjectivity": sentiment_result["subjectivity"]
            }
            
            analyzed_articles.append(article_with_sentiment)
            
            # Update counts and scores
            sentiment_counts[sentiment_result["sentiment"]] += 1
            total_scores.append(sentiment_result["score"])
            confidence_scores.append(sentiment_result["confidence"])
            financial_context_scores.append(sentiment_result["financial_context"])
            
            # Update keyword totals
            for key, value in sentiment_result["keyword_matches"].items():
                keyword_totals[key] += value
        
        # Calculate enhanced sentiment metrics
        total_articles = len(articles)
        sentiment_summary = {
            "total_articles": total_articles,
            "sentiment_distribution": {
                "positive": sentiment_counts["positive"],
                "negative": sentiment_counts["negative"],
                "neutral": sentiment_counts["neutral"]
            },
            "sentiment_percentages": {
                "positive": round((sentiment_counts["positive"] / total_articles) * 100, 1),
                "negative": round((sentiment_counts["negative"] / total_articles) * 100, 1),
                "neutral": round((sentiment_counts["neutral"] / total_articles) * 100, 1)
            },
            "overall_sentiment": self._calculate_overall_sentiment(sentiment_counts, total_scores),
            "sentiment_index": round(np.mean(total_scores), 3) if total_scores else 0.0,
            "average_confidence": round(np.mean(confidence_scores), 3) if confidence_scores else 0.0,
            "average_financial_context": round(np.mean(financial_context_scores), 3) if financial_context_scores else 0.0,
            "keyword_analysis": keyword_totals,
            "sentiment_strength": self._calculate_sentiment_strength(total_scores)
        }
        
        return analyzed_articles, sentiment_summary
    
    def _calculate_overall_sentiment(self, sentiment_counts: Dict, scores: List[float]) -> str:
        """
        Calculate overall sentiment based on counts and scores.
        
        Args:
            sentiment_counts (Dict): Count of each sentiment type
            scores (List[float]): List of sentiment scores
            
        Returns:
            str: Overall sentiment (positive, negative, or neutral)
        """
        if not scores:
            return "neutral"
        
        avg_score = np.mean(scores)
        
        if avg_score > 0.1:
            return "positive"
        elif avg_score < -0.1:
            return "negative"
        else:
            return "neutral"
    
    def _calculate_sentiment_strength(self, scores: List[float]) -> str:
        """
        Calculate sentiment strength based on score variance.
        
        Args:
            scores (List[float]): List of sentiment scores
            
        Returns:
            str: Sentiment strength (strong, moderate, weak)
        """
        if not scores or len(scores) < 2:
            return "weak"
        
        variance = np.var(scores)
        if variance > 0.3:
            return "strong"
        elif variance > 0.1:
            return "moderate"
        else:
            return "weak"
    
    def _get_empty_sentiment_summary(self) -> Dict:
        """
        Return empty sentiment summary structure.
        
        Returns:
            Dict: Empty sentiment summary
        """
        return {
            "total_articles": 0,
            "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0},
            "sentiment_percentages": {"positive": 0, "negative": 0, "neutral": 0},
            "overall_sentiment": "neutral",
            "sentiment_index": 0.0,
            "average_confidence": 0.0,
            "average_financial_context": 0.0,
            "keyword_analysis": {"positive": 0, "negative": 0, "neutral": 0},
            "sentiment_strength": "weak"
        }

def fetch_stock_news_with_sentiment(ticker: str) -> Dict:
    """
    Fetch news articles for a stock ticker and analyze their sentiment.
    
    Args:
        ticker (str): Stock ticker symbol
        
    Returns:
        Dict: News data with enhanced sentiment analysis
    """
    try:
        import yfinance as yf
        
        # Get company name from yfinance
        stock = yf.Ticker(ticker)
        company_name = stock.info.get("longName", ticker)
        
        # Create a more flexible search query
        if ".BO" in ticker or ".NS" in ticker:
            # For Indian stocks, use the base ticker name
            base_ticker = ticker.split('.')[0]
            search_query = f"{base_ticker} OR {company_name}"
        else:
            # For US stocks, use both ticker and company name
            search_query = f"{ticker} OR {company_name}"
        
        # Clean up the search query
        search_query = search_query.replace("&", "and").replace("'", "").replace('"', "")
        print(f"DEBUG: Company Name: {company_name}")
        print(f"DEBUG: Final Search Query: {search_query}")
        
        # Get news API key from environment
        NEWS_API_KEY = os.getenv("NEWS_API_KEY")
        if not NEWS_API_KEY:
            return {
                "articles": [],
                "sentiment_summary": EnhancedSentimentAnalyzer()._get_empty_sentiment_summary()
            }
        
        # Fetch news from NewsAPI
        url = f'https://newsapi.org/v2/everything?q={search_query}&apiKey={NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=3'
        print(f"DEBUG: Searching for news with query: {search_query}")
        print(f"DEBUG: NewsAPI URL: {url}")
        response = requests.get(url)
        news_data = response.json()
        print(f"DEBUG: NewsAPI Response Status: {news_data.get('status')}")
        print(f"DEBUG: NewsAPI Articles Found: {len(news_data.get('articles', []))}")
        if news_data.get('status') != 'ok':
            print(f"DEBUG: NewsAPI Error: {news_data.get('message', 'Unknown error')}")
        
        if news_data.get("status") == "ok":
            articles = news_data.get("articles", [])
            if articles:
                # Analyze sentiment for all articles using enhanced analyzer
                analyzer = EnhancedSentimentAnalyzer()
                analyzed_articles, sentiment_summary = analyzer.analyze_news_articles(articles)
                return {
                    "articles": analyzed_articles,
                    "sentiment_summary": sentiment_summary
                }
            else:
                return {
                    "articles": [],
                    "sentiment_summary": analyzer._get_empty_sentiment_summary()
                }
        else:
            return {
                "articles": [],
                "sentiment_summary": EnhancedSentimentAnalyzer()._get_empty_sentiment_summary()
            }
    except Exception as e:
        logging.error(f"Error fetching news: {e}")
        return {
            "articles": [],
            "sentiment_summary": EnhancedSentimentAnalyzer()._get_empty_sentiment_summary()
        }

# Global instance for reuse
enhanced_sentiment_analyzer = EnhancedSentimentAnalyzer()

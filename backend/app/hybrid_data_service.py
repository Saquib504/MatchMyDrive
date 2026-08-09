import asyncio
import logging
from typing import Any, Optional
from app.database import query_cars as query_mock_cars, get_category_price_range as get_mock_price_range
from app.auto_dev_client import auto_dev_client
from app.car_image_service import car_image_service

logger = logging.getLogger(__name__)

class HybridDataService:
    """Hybrid data service that combines real API data with mock fallback"""
    
    def __init__(self):
        self.api_client = auto_dev_client
        self.use_real_data = self.api_client.enabled
    
    async def query_cars(
        self,
        category: Optional[str] = None,
        max_budget: Optional[float] = None,
        is_rental: bool = True,
        min_seats: int = 1,
        limit: int = 50,  # Increased from 6 to show more results
        preferred_brand: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Query cars with API fallback to local database"""
        
        
        # Use database for "All" categories to get variety across all categories
        # API tends to return limited variety when no specific category is specified
        if category is None:
            logger.info("Using local database for 'All' categories to get variety")
            mock_cars = query_mock_cars(
                category=category,
                max_budget=max_budget,
                is_rental=is_rental,
                min_seats=min_seats,
                limit=limit,
                preferred_brand=preferred_brand,
            )
            # Database cars have fake VINs, so use local image matching only
            return mock_cars
        
        if self.use_real_data:
            try:
                # Try to get real data from Auto.dev API
                real_cars = await self._query_api_cars(
                    category=category,
                    max_budget=max_budget,
                    is_rental=is_rental,
                    limit=limit,
                    preferred_brand=preferred_brand,
                )
                
                if real_cars:
                    logger.info(f"✅ Retrieved {len(real_cars)} real cars from Auto.dev API")
                    return real_cars
                else:
                    logger.info("No results from API, falling back to local database")
            except Exception as e:
                logger.error(f"API query failed: {e}, falling back to local database")
        
        # Fallback to local database
        logger.info("Using local database for car query")
        return query_mock_cars(
            category=category,
            max_budget=max_budget,
            is_rental=is_rental,
            min_seats=min_seats,
            limit=limit,
            preferred_brand=preferred_brand,
        )
    
    async def _query_api_cars(
        self,
        category: Optional[str] = None,
        max_budget: Optional[float] = None,
        is_rental: bool = True,
        limit: int = 6,
        preferred_brand: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Query cars from Auto.dev API"""
        
        # Map category to Auto.dev body style
        body_style = self._map_category_to_body_style(category) if category else None
        logger.info(f"Searching for: category={category}, body_style={body_style}, max_budget={max_budget}, is_rental={is_rental}, preferred_brand={preferred_brand}")
        
        # For rental, we need to convert daily budget to purchase price range
        # Rough estimate: daily rate * 365 * 3 years = purchase price
        if is_rental and max_budget:
            max_purchase_price = max_budget * 365 * 3
            min_price = 0
            logger.info(f"Converted rental budget ${max_budget}/day to purchase price ${max_purchase_price}")
        elif max_budget:
            max_purchase_price = max_budget
            min_price = 0
        else:
            max_purchase_price = None
            min_price = None
        
        # Search listings - only pass body_style if category is specified
        # For "All" categories, don't pass body_style to get all body types
        search_params = {
            "min_price": min_price,
            "max_price": max_purchase_price,
            "limit": limit * 2  # Get more to filter and rank
        }
        
        if body_style:
            search_params["body_style"] = body_style
            
        logger.info(f"Calling Auto.dev API with: {search_params}")
        listings = await self.api_client.search_listings(**search_params)
        
        logger.info(f"Received {len(listings)} listings from API")
        
        # Filter by preferred brand if specified
        if preferred_brand and listings:
            logger.info(f"Filtering {len(listings)} listings by preferred brand: {preferred_brand}")
            listings = [listing for listing in listings if listing.get('make', '').lower() == preferred_brand.lower()]
            logger.info(f"After brand filter: {len(listings)} listings")
        
        # Transform listings to car format
        cars = []
        
        for listing in listings[:limit]:
            car = self.api_client.transform_listing_to_car(listing)
            
            # Apply category filter only if category is specified
            if category and car["category"] != category:
                continue
            
            # Apply budget filter
            if max_budget:
                if is_rental:
                    if car["daily_rental_rate"] > max_budget:
                        continue
                else:
                    if car["purchase_price"] > max_budget:
                        continue
            
            cars.append(car)
        
        return cars
    
    def get_category_price_range(self, category: str) -> dict[str, float]:
        """Get price range with API fallback to mock data"""
        
        if self.use_real_data:
            try:
                # For now, use mock data for price ranges
                # In future, could implement API-based price aggregation
                pass
            except Exception as e:
                logger.error(f"API price range query failed: {e}")
        
        # Fallback to mock data
        return get_mock_price_range(category)
    
    def _map_category_to_body_style(self, category: str) -> Optional[str]:
        """Map internal category to Auto.dev body style"""
        category_mapping = {
            "SUV": "SUV",
            "Sedan": "Sedan",
            "EV": "Electric",
            "Luxury": "Luxury",
            "Sports": "Sports Car",
            "Hybrid": "Hybrid",
            "Compact": "Compact",
            "Truck": "Truck",
            "Minivan": "Minivan",
            "Convertible": "Convertible",
        }
        return category_mapping.get(category)
    


# Global service instance
hybrid_data_service = HybridDataService()
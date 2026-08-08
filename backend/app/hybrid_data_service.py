import asyncio
import logging
from typing import Any, Optional
from app.database import query_cars as query_mock_cars, get_category_price_range as get_mock_price_range
from app.auto_dev_client import auto_dev_client

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
        limit: int = 6,
    ) -> list[dict[str, Any]]:
        """Query cars with API fallback to local database"""
        
        print(f"DEBUG query_cars: use_real_data={self.use_real_data}")
        
        if self.use_real_data:
            try:
                print("DEBUG: Calling _query_api_cars")
                # Try to get real data from Auto.dev API
                real_cars = await self._query_api_cars(
                    category=category,
                    max_budget=max_budget,
                    is_rental=is_rental,
                    limit=limit
                )
                
                print(f"DEBUG: API returned {len(real_cars)} cars")
                if real_cars:
                    logger.info(f"✅ Retrieved {len(real_cars)} real cars from Auto.dev API")
                    return real_cars
                else:
                    logger.info("No results from API, falling back to local database")
                    print("DEBUG: No API results, falling back to local DB")
            except Exception as e:
                logger.error(f"API query failed: {e}, falling back to local database")
                print(f"DEBUG: API exception: {e}, falling back to local DB")
        
        # Fallback to local database
        logger.info("Using local database for car query")
        print("DEBUG: Using local database")
        return query_mock_cars(
            category=category,
            max_budget=max_budget,
            is_rental=is_rental,
            min_seats=min_seats,
            limit=limit,
        )
    
    async def _query_api_cars(
        self,
        category: Optional[str] = None,
        max_budget: Optional[float] = None,
        is_rental: bool = True,
        limit: int = 6,
    ) -> list[dict[str, Any]]:
        """Query cars from Auto.dev API"""
        
        # Map category to Auto.dev body style
        body_style = self._map_category_to_body_style(category) if category else None
        logger.info(f"Searching for: category={category}, body_style={body_style}, max_budget={max_budget}, is_rental={is_rental}")
        
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
        
        # Search listings
        logger.info(f"Calling Auto.dev API with: body_style={body_style}, max_price={max_purchase_price}, limit={limit}")
        listings = await self.api_client.search_listings(
            body_style=body_style,
            min_price=min_price,
            max_price=max_purchase_price,
            limit=limit * 2  # Get more to filter and rank
        )
        
        logger.info(f"Received {len(listings)} listings from API")
        
        # If no results with filters, try without filters
        if not listings:
            logger.warning("No results with filters, trying without filters")
            listings = await self.api_client.search_listings(
                limit=limit * 2
            )
            logger.info(f"Received {len(listings)} listings from API without filters")
        
        # Transform listings to car format
        cars = []
        for listing in listings[:limit]:
            print(f"DEBUG: Transforming listing: {listing.get('vehicle', {}).get('make')}")
            car = self.api_client.transform_listing_to_car(listing)
            print(f"DEBUG: Transformed car: {car.get('make')} {car.get('model')} ${car.get('purchase_price')} (Category: {car.get('category')})")
            
            # Apply additional filters
            if category and car["category"] != category:
                print(f"DEBUG: Filtered out - category mismatch: {car['category']} != {category}")
                continue
            
            # Apply budget filter
            if max_budget:
                if is_rental:
                    if car["daily_rental_rate"] > max_budget:
                        print(f"DEBUG: Filtered out - rental rate ${car['daily_rental_rate']} > ${max_budget}")
                        continue
                else:
                    if car["purchase_price"] > max_budget:
                        print(f"DEBUG: Filtered out - purchase price ${car['purchase_price']} > ${max_budget}")
                        continue
            
            print(f"DEBUG: ✅ Added car: {car.get('make')} {car.get('model')} (source: {car.get('source')})")
            cars.append(car)
        
        print(f"DEBUG: Final result: {len(cars)} cars from API")
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
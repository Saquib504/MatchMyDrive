import os
import httpx
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)

class AutoDevClient:
    """Client for Auto.dev API - Vehicle listings, photos, and specifications"""
    
    def __init__(self):
        self.api_key = os.environ.get("AUTO_DEV_API_KEY", "")
        self.base_url = "https://api.auto.dev"
        self.enabled = bool(self.api_key)
        
        if not self.enabled:
            logger.warning("Auto.dev API key not found. Running in mock mode.")
    
    async def search_listings(
        self,
        make: Optional[str] = None,
        model: Optional[str] = None,
        year: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        body_style: Optional[str] = None,
        limit: int = 10
    ) -> list[dict[str, Any]]:
        """Search vehicle listings with filters"""
        pass
        
        if not self.enabled:
            logger.warning("Auto.dev API not enabled")
            return []
        
        # Build query parameters according to Auto.dev API documentation
        params = {"limit": limit}
        
        if make:
            params["vehicle.make"] = make
        if model:
            params["vehicle.model"] = model
        if year:
            params["vehicle.year"] = str(year)
        if body_style:
            params["vehicle.bodyStyle"] = body_style
        if max_price:
            params["retailListing.price"] = f"0-{max_price}"
        
        pass
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/listings",
                    params=params,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                pass
                response.raise_for_status()
                data = response.json()
                pass
                
                # Handle response structure according to docs
                if isinstance(data, dict):
                    if "data" in data:
                        listings = data["data"]
                        pass
                        return listings
                    else:
                        pass
                        return []
                elif isinstance(data, list):
                    pass
                    return data
                else:
                    pass
                    return []
                    
        except httpx.HTTPError as e:
            pass
            logger.error(f"Auto.dev API error: {e}")
            return []
        except Exception as e:
            pass
            logger.error(f"Auto.dev API error: {e}")
            return []
    
    async def get_vehicle_photos(self, vin: str) -> list[str]:
        """Get vehicle photos by VIN using Auto.dev API"""
        if not self.enabled:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/photos/{vin}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 404:
                    logger.warning(f"No photos available for VIN {vin}")
                    return []
                
                response.raise_for_status()
                data = response.json()
                
                # Extract retail photos from response
                if "data" in data and "retail" in data["data"]:
                    photos = data["data"]["retail"]
                    logger.info(f"Retrieved {len(photos)} photos for VIN {vin}")
                    return photos
                return []
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"No photos available for VIN {vin}")
                return []
            logger.error(f"Auto.dev photos API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Auto.dev photos API error: {e}")
            return []
    
    async def get_car_by_make_model(self, make: str, model: str, year: int) -> dict[str, Any]:
        """Get car data by make, model, year for image fetching"""
        if not self.enabled:
            return {}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/listings",
                    params={
                        "apiKey": self.api_key,
                        "make": make,
                        "model": model,
                        "year": str(year),
                        "limit": 1
                    }
                )
                response.raise_for_status()
                data = response.json()
                if isinstance(data, dict) and "data" in data:
                    listings = data["data"]
                    if listings and len(listings) > 0:
                        return listings[0]
                elif isinstance(data, list) and len(data) > 0:
                    return data[0]
                return {}
        except httpx.HTTPError as e:
            logger.error(f"Auto.dev car lookup error: {e}")
            return {}
    
    async def get_vehicle_specs(self, vin: str) -> dict[str, Any]:
        """Get vehicle specifications by VIN"""
        if not self.enabled:
            return {}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/vin/{vin}",
                    params={"apiKey": self.api_key}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Auto.dev specs API error: {e}")
            return {}
    
    def transform_listing_to_car(self, listing: dict[str, Any]) -> dict[str, Any]:
        """Transform Auto.dev listing to internal car format"""
        # Match the exact structure from the user's example
        vehicle = listing.get('vehicle', {})
        retail_listing = listing.get('retailListing', {})
        
        # Extract vehicle details
        make = vehicle.get('make', 'Unknown')
        model = vehicle.get('model', 'Unknown')
        year = vehicle.get('year', 2024)
        vin = vehicle.get('vin', listing.get('vin', ''))
        body_style = vehicle.get('bodyStyle', '')
        
        # Extract price from retail listing
        price = retail_listing.get('price', 0) if retail_listing else 0
        price = float(price) if price else 0
        
        # Determine if EV based on fuel type
        fuel_type = vehicle.get('fuel', '').lower()
        is_ev = "electric" in fuel_type or "ev" in fuel_type or "plug-in" in fuel_type
        
        # Calculate estimated daily rental rate (roughly 1-2% of vehicle value)
        purchase_price = price
        daily_rental_rate = round(purchase_price * 0.015, 2) if purchase_price > 0 else 0
        
        # Map body style to our categories
        category = self._map_body_style_to_category(body_style)
        
        # Estimate seating based on body style
        seating = self._estimate_seating(body_style)
        
        # Estimate EV range if electric
        ev_range = 0
        if is_ev:
            ev_range = self._estimate_ev_range(make, model)
        
        # Generate a unique ID from VIN or use VIN as ID
        car_id = vin if vin else f"{make}_{model}_{year}".replace(' ', '_')
        
        return {
            "id": car_id,  # Use VIN as ID since Auto.dev doesn't provide IDs
            "make": make,
            "model": model,
            "category": category,
            "year": year,
            "daily_rental_rate": daily_rental_rate,
            "purchase_price": purchase_price,
            "ev_range": ev_range,
            "seating_capacity": seating,
            "rating": 4.5,  # Default rating since API might not provide
            "available_for_rent": True,
            "available_for_buy": True,
            "image_url": "",  # Will be filled by photo API
            "vin": vin,
            "source": "auto_dev",
        }
    
    def _map_body_style_to_category(self, body_style: str) -> str:
        """Map body style to internal category"""
        body_lower = body_style.lower()
        
        if any(s in body_lower for s in ["suv", "crossover"]):
            return "SUV"
        elif any(s in body_lower for s in ["sedan", "hatchback"]):
            return "Sedan"
        elif "convertible" in body_lower:
            return "Convertible"
        elif any(s in body_lower for s in ["coupe", "sports"]):
            return "Sports"
        elif "truck" in body_lower or "pickup" in body_lower:
            return "Truck"
        elif "van" in body_lower or "minivan" in body_lower:
            return "Minivan"
        elif any(s in body_lower for s in ["electric", "ev", "hybrid"]):
            return "EV" if "electric" in body_lower or "ev" in body_lower else "Hybrid"
        else:
            return "Compact"
    
    def _estimate_seating(self, body_style: str) -> int:
        """Estimate seating capacity based on body style"""
        body_lower = body_style.lower()
        
        if any(s in body_lower for s in ["suv", "crossover"]):
            return 5
        elif "truck" in body_lower or "pickup" in body_lower:
            return 5
        elif "van" in body_lower or "minivan" in body_lower:
            return 7
        elif any(s in body_lower for s in ["coupe", "convertible", "sports"]):
            return 2
        else:
            return 5
    
    def _estimate_ev_range(self, make: str, model: str) -> int:
        """Estimate EV range based on make/model (simplified)"""
        make_lower = make.lower()
        model_lower = model.lower()
        
        # Rough estimates for common EVs
        if "tesla" in make_lower:
            if "model s" in model_lower:
                return 405
            elif "model 3" in model_lower:
                return 358
            elif "model x" in model_lower:
                return 348
            elif "model y" in model_lower:
                return 330
        elif "rivian" in make_lower:
            return 314
        elif "ford" in make_lower and "lightning" in model_lower:
            return 320
        elif "chevrolet" in make_lower and "bolt" in model_lower:
            return 259
        elif "hyundai" in make_lower and "ioniq" in model_lower:
            return 303
        elif "kia" in make_lower and "ev6" in model_lower:
            return 310
        
        return 250  # Default estimate

# Global client instance
auto_dev_client = AutoDevClient()
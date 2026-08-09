import httpx
import logging
from typing import Optional, Any
import re
from app.auto_dev_client import auto_dev_client

logger = logging.getLogger(__name__)

class CarImageService:
    """Service for matching car images based on make, model, and year"""
    
    def __init__(self):
        self.api_client = auto_dev_client
    
    # Mapping of makes to their common image URL patterns or APIs
    MAKE_IMAGE_PATTERNS = {
        "tesla": {
            "model_s": "https://www.tesla.com/sites/default/files/modelsx-new/model-s-main-hero-desktop.jpg",
            "model_3": "https://www.tesla.com/sites/default/files/model-3-main-hero-desktop.jpg",
            "model_x": "https://www.tesla.com/sites/default/files/modelsx-new/model-x-main-hero-desktop.jpg",
            "model_y": "https://www.tesla.com/sites/default/files/model-y-new-hero-desktop.jpg",
        },
        "bmw": {
            "default": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800"
        },
        "mercedes-benz": {
            "default": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800"
        },
        "audi": {
            "default": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800"
        },
        "toyota": {
            "default": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800"
        },
        "ford": {
            "default": "https://images.unsplash.com/photo-1583121274602-3ec2830fe1ef?w=800"
        },
        "honda": {
            "default": "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800"
        },
        "porsche": {
            "default": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"
        },
        "volvo": {
            "default": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800"
        },
        "hyundai": {
            "default": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800"
        },
    }
    
    # Fallback high-quality car images organized by category
    CATEGORY_FALLBACK_IMAGES = {
        "SUV": [
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
            "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
        ],
        "Sedan": [
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
            "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
            "https://images.unsplash.com/photo-1583121274602-3ec2830fe1ef?w=800",
        ],
        "EV": [
            "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800",
            "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
        ],
        "Luxury": [
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
            "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800",
        ],
        "Sports": [
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
            "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
            "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800",
        ],
        "Hybrid": [
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800",
            "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
            "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800",
        ],
        "Compact": [
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
            "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
            "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800",
        ],
        "Truck": [
            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
            "https://images.unsplash.com/photo-1583121274602-3ec2830fe1ef?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        ],
        "Minivan": [
            "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
        ],
        "Convertible": [
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
            "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        ],
    }
    
    def get_image_for_car(self, make: str, model: str, category: str, year: int = 2024) -> str:
        """Get appropriate image URL for a specific car"""
        
        make_lower = make.lower().strip()
        model_lower = self._normalize_model_name(model)
        category_upper = category.upper() if category else "Sedan"
        
        # Try to find specific make/model image
        if make_lower in self.MAKE_IMAGE_PATTERNS:
            make_patterns = self.MAKE_IMAGE_PATTERNS[make_lower]
            
            # Check for specific model
            if model_lower in make_patterns:
                return make_patterns[model_lower]
            
            # Check for default make image
            if "default" in make_patterns:
                return make_patterns["default"]
        
        # Fallback to category-based images
        if category_upper in self.CATEGORY_FALLBACK_IMAGES:
            category_images = self.CATEGORY_FALLBACK_IMAGES[category_upper]
            # Use year to pick consistently from category images
            index = year % len(category_images)
            return category_images[index]
        
        # Ultimate fallback
        return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"
    
    def _normalize_model_name(self, model: str) -> str:
        """Normalize model name for matching"""
        # Remove special characters and convert to lowercase
        normalized = re.sub(r'[^a-zA-Z0-9]', '', model).lower()
        # Common model name normalizations
        replacements = {
            "models": "model_s",
            "model3": "model_3",
            "modelx": "model_x",
            "modely": "model_y",
        }
        return replacements.get(normalized, normalized)
    
    async def search_unsplash_for_car(self, make: str, model: str) -> Optional[str]:
        """Search Unsplash for car images (requires API key)"""
        # This would require an Unsplash API key
        # For now, return None to use fallbacks
        return None
    
    async def enhance_car_with_api_image(self, car: dict[str, Any]) -> dict[str, Any]:
        """Enhance car data with real images from Auto.dev API using VIN"""
        
        if not self.api_client.enabled:
            logger.info("Auto.dev API not enabled, using local image matching")
            self.enhance_car_image(car)
            return car
        
        # If car already has a good image from API listing, use it
        if car.get("image_url") and car.get("image_source") == "api":
            logger.info(f"Car already has API image: {car.get('image_url')}")
            return car
        
        vin = car.get("vin", "")
        if not vin:
            logger.info(f"No VIN for car {car.get('id')}, using local image matching")
            self.enhance_car_image(car)
            return car
        
        try:
            # Try to get photos from Auto.dev API using VIN
            photos = await self.api_client.get_vehicle_photos(vin)
            if photos and len(photos) > 0:
                car["image_url"] = photos[0]
                car["all_photos"] = photos
                car["image_source"] = "api"
                logger.info(f"✅ Successfully enhanced car {vin} with {len(photos)} API photos")
                return car
            else:
                # Use local image matching as fallback (silent, no warning)
                logger.debug(f"No API photos for VIN {vin}, using local image matching")
                self.enhance_car_image(car)
        except Exception as e:
            logger.debug(f"Failed to get API photos for VIN {vin}: {e}, using local image matching")
            self.enhance_car_image(car)
        
        return car
    
    def enhance_car_image(self, car: dict[str, Any]) -> dict[str, Any]:
        """Enhance car data with better image matching"""
        make = car.get("make", "Unknown")
        model = car.get("model", "Unknown")
        category = car.get("category", "Sedan")
        year = car.get("year", 2024)
        
        # Always get a better image based on make/model/category
        better_image = self.get_image_for_car(make, model, category, year)
        car["image_url"] = better_image
        car["image_source"] = "matched"
        
        return car

# Global service instance
car_image_service = CarImageService()
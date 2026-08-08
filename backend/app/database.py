import os
import random
import sqlite3
from typing import Any

DB_PATH = os.environ.get("DB_PATH", "data/cars_marketplace.db")

CATEGORIES = [
    "SUV", "Sedan", "EV", "Luxury", "Sports",
    "Hybrid", "Compact", "Truck", "Minivan", "Convertible",
]

BRANDS = [
    "Toyota", "BMW", "Mercedes-Benz", "Tesla", "Ford",
    "Audi", "Porsche", "Hyundai", "Honda", "Volvo",
]

MODEL_NAMES = [
    "Apex", "Vanguard", "Pulse", "Horizon", "Phantom",
    "Elysium", "Starlight", "Maverick", "Titan", "Zenith",
]

CAR_IMAGES = [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400",
    "https://images.unsplash.com/photo-1583121274602-3ec2830fe1ef?w=400",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400",
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400",
]

# Sample VINs for testing Auto.dev API (these are placeholder VINs for demo purposes)
SAMPLE_VINS = [
    "WP0AA2990WS321225",  # Example VIN for testing
    "1HGCM82633A004352",  # Honda Accord
    "1HGCM82633A004353",  # Honda Accord 2
    "JH4KA8260MC000000",  # Acura TL
    "5YJRE3H53EA011234",  # Toyota RAV4
    "1V1BWBLKD5Y501234",  # Volvo XC90
]


def _get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def update_cars_with_vins() -> None:
    """Update existing cars in database with sample VINs for API photo fetching"""
    conn = _get_connection()
    cursor = conn.cursor()
    
    # Check if cars already have VINs
    cursor.execute("SELECT COUNT(*) FROM cars WHERE vin IS NOT NULL")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Update all cars with random VINs
        cursor.execute("SELECT id FROM cars")
        car_ids = [row[0] for row in cursor.fetchall()]
        
        for car_id in car_ids:
            vin = random.choice(SAMPLE_VINS)
            cursor.execute("UPDATE cars SET vin = ? WHERE id = ?", (vin, car_id))
        
        conn.commit()
        print(f"Updated {len(car_ids)} cars with VINs for API photo fetching")
    else:
        print(f"Cars already have VINs ({count} cars)")
    
    conn.close()


def init_db() -> None:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            category TEXT NOT NULL,
            year INTEGER NOT NULL,
            daily_rental_rate REAL NOT NULL,
            purchase_price REAL NOT NULL,
            ev_range INTEGER DEFAULT 0,
            seating_capacity INTEGER NOT NULL,
            rating REAL NOT NULL,
            available_for_rent BOOLEAN DEFAULT 1,
            available_for_buy BOOLEAN DEFAULT 1,
            image_url TEXT,
            vin TEXT,
            source TEXT DEFAULT 'mock',
            trim TEXT,
            mileage INTEGER DEFAULT 0,
            exterior_color TEXT,
            interior_color TEXT,
            fuel_type TEXT DEFAULT 'gasoline',
            transmission TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM cars")
    if cursor.fetchone()[0] == 0:
        cars_data = []
        for category in CATEGORIES:
            for brand in BRANDS:
                for idx in range(1, 3):
                    model = f"{brand} {random.choice(MODEL_NAMES)} {category}-{idx}"
                    daily_rate = round(random.uniform(45, 350), 2)
                    purchase_price = round(random.uniform(22000, 115000), 2)
                    if category in ("EV", "Hybrid"):
                        ev_range = random.choice([240, 280, 310, 380, 420])
                    elif category == "Sedan" and random.random() < 0.3:
                        ev_range = random.choice([0, 250, 320])
                    else:
                        ev_range = 0

                    if category in ("SUV", "Minivan", "Truck"):
                        seating = random.choice([5, 7, 8])
                    elif category in ("Sports", "Convertible"):
                        seating = 2
                    else:
                        seating = 5

                    rating = round(random.uniform(4.2, 4.9), 1)
                    # Assign a sample VIN for API photo fetching
                    vin = random.choice(SAMPLE_VINS)
                    cars_data.append((
                        brand, model, category, random.randint(2022, 2026),
                        daily_rate, purchase_price, ev_range, seating, rating,
                        True, True, random.choice(CAR_IMAGES), vin, 'mock',
                        None, 0, None, None, 'gasoline', None,
                    ))

        cursor.executemany("""
            INSERT INTO cars (
                make, model, category, year, daily_rental_rate, purchase_price,
                ev_range, seating_capacity, rating, available_for_rent,
                available_for_buy, image_url, vin, source, trim, mileage,
                exterior_color, interior_color, fuel_type, transmission
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, cars_data)
        conn.commit()

    conn.close()


def query_cars(
    category: str | None = None,
    max_budget: float | None = None,
    is_rental: bool = True,
    min_seats: int = 1,
    limit: int = 6,
) -> list[dict[str, Any]]:
    conn = _get_connection()
    cursor = conn.cursor()

    query = """
        SELECT id, make, model, category, year, daily_rental_rate, purchase_price,
               ev_range, seating_capacity, rating, image_url, vin
        FROM cars
        WHERE seating_capacity >= ?
    """
    params: list[Any] = [min_seats]

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if max_budget is not None:
        if is_rental:
            query += " AND daily_rental_rate <= ? AND available_for_rent = 1"
        else:
            query += " AND purchase_price <= ? AND available_for_buy = 1"
        params.append(max_budget)

    query += " ORDER BY rating DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_category_price_range(category: str) -> dict[str, float]:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            MIN(daily_rental_rate), MAX(daily_rental_rate),
            MIN(purchase_price), MAX(purchase_price),
            COUNT(*)
        FROM cars WHERE category = ?
    """, (category,))
    row = cursor.fetchone()
    conn.close()
    if not row or row[4] == 0:
        return {
            "min_rental": 45, "max_rental": 350,
            "min_purchase": 22000, "max_purchase": 115000,
            "count": 0,
        }
    return {
        "min_rental": row[0], "max_rental": row[1],
        "min_purchase": row[2], "max_purchase": row[3],
        "count": row[4],
    }


def get_car_by_id(car_id: int) -> dict[str, Any] | None:
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def upsert_car_from_api(car_data: dict[str, Any]) -> int:
    """Insert or update a car from API data"""
    conn = _get_connection()
    cursor = conn.cursor()
    
    # Check if car with VIN already exists
    if car_data.get("vin"):
        cursor.execute("SELECT id FROM cars WHERE vin = ?", (car_data["vin"],))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing car
            cursor.execute("""
                UPDATE cars SET
                    make = ?, model = ?, category = ?, year = ?,
                    daily_rental_rate = ?, purchase_price = ?, ev_range = ?,
                    seating_capacity = ?, rating = ?, image_url = ?,
                    trim = ?, mileage = ?, exterior_color = ?, interior_color = ?,
                    fuel_type = ?, transmission = ?, source = 'auto_dev',
                    updated_at = CURRENT_TIMESTAMP
                WHERE vin = ?
            """, (
                car_data.get("make"),
                car_data.get("model"),
                car_data.get("category"),
                car_data.get("year"),
                car_data.get("daily_rental_rate"),
                car_data.get("purchase_price"),
                car_data.get("ev_range", 0),
                car_data.get("seating_capacity", 5),
                car_data.get("rating", 4.5),
                car_data.get("image_url"),
                car_data.get("trim"),
                car_data.get("mileage", 0),
                car_data.get("exterior_color"),
                car_data.get("interior_color"),
                car_data.get("fuel_type", "gasoline"),
                car_data.get("transmission"),
                car_data["vin"],
            ))
            car_id = existing[0]
        else:
            # Insert new car
            cursor.execute("""
                INSERT INTO cars (
                    make, model, category, year, daily_rental_rate, purchase_price,
                    ev_range, seating_capacity, rating, available_for_rent, available_for_buy,
                    image_url, vin, source, trim, mileage, exterior_color, interior_color,
                    fuel_type, transmission
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                car_data.get("make"),
                car_data.get("model"),
                car_data.get("category"),
                car_data.get("year"),
                car_data.get("daily_rental_rate"),
                car_data.get("purchase_price"),
                car_data.get("ev_range", 0),
                car_data.get("seating_capacity", 5),
                car_data.get("rating", 4.5),
                True, True,
                car_data.get("image_url"),
                car_data.get("vin"),
                "auto_dev",
                car_data.get("trim"),
                car_data.get("mileage", 0),
                car_data.get("exterior_color"),
                car_data.get("interior_color"),
                car_data.get("fuel_type", "gasoline"),
                car_data.get("transmission"),
            ))
            car_id = cursor.lastrowid
    else:
        # Insert without VIN (fallback)
        cursor.execute("""
            INSERT INTO cars (
                make, model, category, year, daily_rental_rate, purchase_price,
                ev_range, seating_capacity, rating, available_for_rent, available_for_buy,
                image_url, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            car_data.get("make"),
            car_data.get("model"),
            car_data.get("category"),
            car_data.get("year"),
            car_data.get("daily_rental_rate"),
            car_data.get("purchase_price"),
            car_data.get("ev_range", 0),
            car_data.get("seating_capacity", 5),
            car_data.get("rating", 4.5),
            True, True,
            car_data.get("image_url"),
            "auto_dev",
        ))
        car_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    return car_id


if __name__ == "__main__":
    init_db()
    cars = query_cars()
    print(f"Database initialized with {len(cars)} sample query results (120+ total listings).")

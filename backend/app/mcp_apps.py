from pydantic import BaseModel, Field


class MCPPreferenceFormApp(BaseModel):
    app_id: str = "app_car_preference_interview"
    title: str = "Car Matchmaker Preferences"
    type: str = "mcp_app"
    fields: dict = Field(default_factory=lambda: {
        "intent": {
            "type": "select",
            "options": ["Rent", "Buy"],
            "default": "Rent",
            "label": "Intent",
        },
        "category": {
            "type": "select",
            "options": [
                "SUV", "Sedan", "EV", "Luxury", "Sports",
                "Hybrid", "Compact", "Truck", "Minivan", "Convertible",
            ],
            "label": "Car Category",
        },
        "budget": {
            "type": "number",
            "label_rent": "Max Daily Rental Rate ($/day)",
            "label_buy": "Max Purchase Budget ($ total)",
            "default_rent": 200,
            "default_buy": 60000,
            "min_rent": 50,
            "min_buy": 15000,
        },
        "target_date": {
            "type": "date",
            "label": "Target Purchase / Rental Date",
        },
    })


class MCPCheckoutApp(BaseModel):
    app_id: str = "app_mock_checkout"
    title: str = "Safe Mock Payment & Booking Checkout"
    type: str = "mcp_app"
    requires_mock_card: bool = True

    @staticmethod
    def render_checkout_payload(
        car_id: int,
        car_model: str,
        amount: float,
        mode: str,
    ) -> dict:
        return {
            "app_id": "app_mock_checkout",
            "car_id": car_id,
            "car_model": car_model,
            "amount": amount,
            "mode": mode,
            "merchant": "Amulate AI Car Matchmaker Sandbox",
            "is_safe_sandbox": True,
            "payment_fields": [
                "cardholder_name",
                "mock_card_number",
                "exp_date",
                "cvv",
            ],
        }

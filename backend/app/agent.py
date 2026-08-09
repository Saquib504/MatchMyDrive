import os
import asyncio
from typing import Any

from app.database import get_car_by_id, get_category_price_range, query_cars
from app.mcp_apps import MCPCheckoutApp, MCPPreferenceFormApp
from app.observability import trace_agent_step
from app.hybrid_data_service import hybrid_data_service
from app.car_image_service import car_image_service

AgentState = str  # INTERVIEW | RESEARCH | RECOMMENDATION | CHECKOUT


class MultistepCarAgent:
    def __init__(self) -> None:
        self.state: AgentState = "INTERVIEW"
        self.user_preferences: dict[str, Any] = {}
        self.last_recommendations: list[dict[str, Any]] = []
        self.budget_relaxed: bool = False

    async def process_message(
        self,
        user_input: str,
        form_data: dict | None = None,
    ) -> dict[str, Any]:
        a2ui_events: list[dict[str, Any]] = []
        text_response = ""

        if form_data and "checkout_car_id" in form_data:
            return self._handle_checkout(form_data)

        if form_data and "checkout_confirmed" in form_data:
            return self._handle_checkout_confirmation(form_data)

        if form_data and self._is_preference_form(form_data):
            self.user_preferences = form_data
            self.state = "RESEARCH"
            trace_agent_step("interview_complete", {"preferences": form_data})

        if self.state == "INTERVIEW":
            text_response = (
                "Welcome to the AI Car Matchmaker! Please fill out your preferences "
                "below so I can research the best options for you."
            )
            a2ui_events.append({
                "a2ui_type": "RENDER_MCP_APP",
                "app": MCPPreferenceFormApp().model_dump(),
            })

        elif self.state == "RESEARCH":
            a2ui_events.extend(await self._run_research())
            text_response, catalog_event = await self._build_recommendations()
            a2ui_events.append(catalog_event)
            self.state = "RECOMMENDATION"

        elif self.state == "RECOMMENDATION":
            if form_data and "checkout_car_id" in form_data:
                return self._handle_checkout(form_data)
            text_response = (
                "Your recommendations are ready above. Click **Book / Purchase Now** "
                "on any car to proceed to our safe mock checkout."
            )

        elif self.state == "CHECKOUT":
            text_response = "Checkout complete! Would you like to start a new search?"

        return {
            "text": text_response,
            "a2ui_events": a2ui_events,
            "current_state": self.state,
        }

    def _is_preference_form(self, form_data: dict) -> bool:
        return "intent" in form_data and "category" in form_data

    async def _run_research(self) -> list[dict[str, Any]]:
        trace_agent_step("research_start", self.user_preferences)

        in_progress = {
            "a2ui_type": "UPDATE_STATUS",
            "status_steps": [
                {"step": "Analyzing user preferences", "status": "COMPLETED"},
                {"step": "Searching marketplace (real-time API + DB)...", "status": "IN_PROGRESS"},
                {"step": "Ranking trade-offs & generating match scores", "status": "PENDING"},
            ],
        }

        is_rental = self.user_preferences.get("intent", "Rent").lower() == "rent"
        category = self.user_preferences.get("category", "SUV")
        budget = float(self.user_preferences.get("budget", 200))
        self.budget_relaxed = False

        # Use hybrid data service (API + fallback to mock)
        self.last_recommendations = await hybrid_data_service.query_cars(
            category=category,
            max_budget=budget,
            is_rental=is_rental,
        )

        # Enhance images for all cars with API
        for car in self.last_recommendations:
            await car_image_service.enhance_car_with_api_image(car)

        if not self.last_recommendations:
            price_range = hybrid_data_service.get_category_price_range(category)
            min_price = price_range["min_rental"] if is_rental else price_range["min_purchase"]
            if budget < min_price:
                self.last_recommendations = await hybrid_data_service.query_cars(
                    category=category,
                    max_budget=None,
                    is_rental=is_rental,
                )
                # Enhance images for fallback results with API
                for car in self.last_recommendations:
                    await car_image_service.enhance_car_with_api_image(car)
                self.budget_relaxed = True

        completed = {
            "a2ui_type": "UPDATE_STATUS",
            "status_steps": [
                {"step": "Analyzing user preferences", "status": "COMPLETED"},
                {"step": "Searching marketplace (real-time API + DB)...", "status": "COMPLETED"},
                {"step": "Ranking trade-offs & generating match scores", "status": "COMPLETED"},
            ],
        }

        trace_agent_step("research_complete", {"matches": len(self.last_recommendations)})
        return [in_progress, completed]

    async def _build_recommendations(self) -> tuple[str, dict[str, Any]]:
        is_rental = self.user_preferences.get("intent", "Rent").lower() == "rent"
        category = self.user_preferences.get("category", "SUV")
        budget = float(self.user_preferences.get("budget", 200))

        catalog_items = []
        for idx, car in enumerate(self.last_recommendations, 1):
            price_str = (
                f"${car['daily_rental_rate']}/day"
                if is_rental
                else f"${car['purchase_price']:,.2f}"
            )
            match_score = max(82, 99 - (idx * 3))
            
            # Use make and model from car data if available
            car_title = f"{car['year']} {car['make']} {car['model']}" if car.get('make') else f"{car['year']} {car['model']}"
            
            catalog_items.append({
                "id": car["id"],
                "title": car_title,
                "category": car["category"],
                "year": car["year"],
                "price_display": price_str,
                "price_value": car["daily_rental_rate"] if is_rental else car["purchase_price"],
                "rating": car["rating"],
                "match_score": f"{match_score}% Match",
                "reasoning": (
                    f"Matches {category} preference within budget with "
                    f"exceptional user rating ({car['rating']}/5.0)."
                ),
                "ev_info": (
                    f"EV Range: {car['ev_range']} mi"
                    if car.get("ev_range", 0) > 0
                    else "Gasoline Engine"
                ),
                "image_url": car.get("image_url", ""),
                "source": car.get("source", "mock"),
            })

        tradeoff = self._build_tradeoff_matrix(catalog_items, is_rental)
        price_range = hybrid_data_service.get_category_price_range(category)

        if not catalog_items:
            min_price = price_range["min_rental"] if is_rental else price_range["min_purchase"]
            text = (
                f"No **{category}** cars found within your budget of **${budget:,.0f}** "
                f"({'rental/day' if is_rental else 'purchase'}). "
                f"Prices in this category start at **${min_price:,.0f}**. "
                "Try increasing your budget or switching to Rent if you meant a daily rate."
            )
        elif self.budget_relaxed:
            min_price = price_range["min_rental"] if is_rental else price_range["min_purchase"]
            text = (
                f"Your budget of **${budget:,.0f}** is below the minimum "
                f"**${min_price:,.0f}** for **{category}** "
                f"({'rental/day' if is_rental else 'purchase'}). "
                "Showing the best available options in your category instead:"
            )
        else:
            text = (
                f"I evaluated options matching your requirements for a **{category}** "
                f"under **${budget:,.0f}** ({'Rental/day' if is_rental else 'Purchase'}). "
                "Here are top-ranked matches:"
            )

        catalog_event = {
            "a2ui_type": "RENDER_CATALOG_GRID",
            "items": catalog_items,
            "tradeoff_matrix": tradeoff,
        }

        return text, catalog_event

    def _build_tradeoff_matrix(
        self,
        items: list[dict[str, Any]],
        is_rental: bool,
    ) -> dict[str, Any]:
        if not items:
            return {
                "top_choice": "N/A",
                "value_choice": "N/A",
                "tradeoff_summary": "No matches found for your criteria.",
            }

        top_rated = max(items, key=lambda x: x["rating"])
        best_value = min(items, key=lambda x: x["price_value"])

        price_key = "daily rate" if is_rental else "purchase price"
        savings_pct = 0
        if top_rated["price_value"] > 0 and best_value["id"] != top_rated["id"]:
            savings_pct = round(
                (1 - best_value["price_value"] / top_rated["price_value"]) * 100
            )

        summary = (
            f"**{top_rated['title']}** offers the highest rating ({top_rated['rating']}/5), "
            f"while **{best_value['title']}** is the best value "
            f"({savings_pct}% lower {price_key})."
        )

        return {
            "top_choice": top_rated["title"],
            "value_choice": best_value["title"],
            "tradeoff_summary": summary,
            "matrix": [
                {
                    "option": top_rated["title"],
                    "rating": top_rated["rating"],
                    "price": top_rated["price_display"],
                    "label": "Top Rated",
                },
                {
                    "option": best_value["title"],
                    "rating": best_value["rating"],
                    "price": best_value["price_display"],
                    "label": "Best Value",
                },
            ],
        }

    def _handle_checkout(self, form_data: dict) -> dict[str, Any]:
        car_id = int(form_data["checkout_car_id"])
        car = get_car_by_id(car_id)
        car_name = form_data.get("car_name") or (
            f"{car['year']} {car['model']}" if car else "Selected Vehicle"
        )

        is_rental = self.user_preferences.get("intent", "Rent").lower() == "rent"
        if car:
            amount = car["daily_rental_rate"] if is_rental else car["purchase_price"]
        else:
            amount = float(form_data.get("amount", 150.0))

        mode = self.user_preferences.get("intent", "Rent")
        self.state = "CHECKOUT"
        trace_agent_step("checkout_initiated", {"car_id": car_id, "amount": amount})

        return {
            "text": f"Opening secure, mocked payment gateway for **{car_name}**...",
            "a2ui_events": [{
                "a2ui_type": "RENDER_MCP_APP",
                "app": MCPCheckoutApp.render_checkout_payload(
                    car_id, car_name, amount, mode
                ),
            }],
            "current_state": self.state,
        }

    def _handle_checkout_confirmation(self, form_data: dict) -> dict[str, Any]:
        car_id = form_data.get("checkout_car_id", "unknown")
        trace_agent_step("checkout_confirmed", {"car_id": car_id})

        return {
            "text": (
                "Mock payment processed successfully! Your booking is confirmed. "
                "No real charges were made — this is a sandbox environment."
            ),
            "a2ui_events": [{
                "a2ui_type": "UPDATE_STATUS",
                "status_steps": [
                    {"step": "Payment validated (mock)", "status": "COMPLETED"},
                    {"step": "Booking confirmed", "status": "COMPLETED"},
                    {"step": "Receipt generated", "status": "COMPLETED"},
                ],
            }],
            "current_state": "CHECKOUT",
        }

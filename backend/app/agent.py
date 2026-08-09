import os
import asyncio
import re
import warnings
from typing import Any

from anthropic import Anthropic
import google.generativeai as genai
from openai import OpenAI
from app.database import get_car_by_id, get_category_price_range, query_cars
from app.mcp_apps import MCPCheckoutApp, MCPPreferenceFormApp
from app.observability import trace_agent_step
from app.hybrid_data_service import hybrid_data_service
from app.car_image_service import car_image_service

# Suppress deprecation warnings for google.generativeai
warnings.filterwarnings("ignore", category=FutureWarning)

AgentState = str  # INTERVIEW | RESEARCH | RECOMMENDATION | CHECKOUT


class MultistepCarAgent:
    def __init__(self) -> None:
        self.state: AgentState = "INTERVIEW"
        self.user_preferences: dict[str, Any] = {}
        self.last_recommendations: list[dict[str, Any]] = []
        self.budget_relaxed: bool = False
        self.conversation_history: list[dict[str, str]] = []
        self.form_shown: bool = False
        
        # Initialize LLM clients with automatic fallback support
        self.llm_provider = os.environ.get("LLM_PROVIDER", "gemini").lower()  # Default to Gemini
        self.anthropic = None
        self.gemini_client = None
        self.openai_client = None
        self.moonshot_client = None
        self.use_llm = False
        self.tried_providers = set()  # Track which providers we've tried for fallback
        
        # Initialize ALL available LLM clients for automatic fallback
        self._initialize_all_llm_clients()
    
    def _initialize_all_llm_clients(self):
        """Initialize all available LLM clients for automatic fallback"""
        # Initialize Anthropic
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        if anthropic_key:
            try:
                self.anthropic = Anthropic(api_key=anthropic_key)
            except Exception as e:
        
        # Initialize Gemini
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                self.gemini_client = genai.GenerativeModel('models/gemini-2.0-flash')
            except Exception as e:
        
        # Initialize OpenAI
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                self.openai_client = OpenAI(api_key=openai_key)
            except Exception as e:
        
        # Initialize Moonshot (Kimi K3)
        moonshot_key = os.environ.get("MOONSHOT_API_KEY")
        if moonshot_key:
            try:
                self.moonshot_client = OpenAI(
                    api_key=moonshot_key,
                    base_url="https://api.moonshot.ai/v1"
                )
            except Exception as e:
        
        # Set use_llm if at least one client is available
        self.use_llm = bool(self.anthropic or self.gemini_client or self.openai_client or self.moonshot_client)
        if self.use_llm:
            available = sum([bool(self.anthropic), bool(self.gemini_client), bool(self.openai_client), bool(self.moonshot_client)])
        else:

    def reset(self) -> None:
        """Reset the agent to initial state"""
        self.state = "INTERVIEW"
        self.user_preferences = {}
        self.last_recommendations = []
        self.budget_relaxed = False
        self.conversation_history = []
        self.form_shown = False

    def _extract_preferences_from_text(self, text: str) -> dict[str, Any]:
        """Extract car preferences from natural language text"""
        text_lower = text.lower()
        preferences = {}
        
        # Extract intent (rent/buy)
        if any(word in text_lower for word in ["rent", "lease", "rental"]):
            preferences["intent"] = "Rent"
        elif any(word in text_lower for word in ["buy", "purchase", "own"]):
            preferences["intent"] = "Buy"
        
        # Extract category with better matching
        categories = {
            "sports car": "Sports", "sport": "Sports", "sports": "Sports",
            "suv": "SUV", "sedan": "Sedan", 
            "ev": "EV", "electric": "EV", "electric car": "EV",
            "luxury": "Luxury", "luxury car": "Luxury",
            "hybrid": "Hybrid", "hybrid car": "Hybrid",
            "compact": "Compact", "compact car": "Compact",
            "truck": "Truck", "pickup": "Truck", "pickup truck": "Truck",
            "minivan": "Minivan", "van": "Minivan",
            "convertible": "Convertible", "coupe": "Sports"
        }
        
        # Sort by length (longest first) to match "sports car" before "sport"
        for keyword, category in sorted(categories.items(), key=lambda x: len(x[0]), reverse=True):
            if keyword in text_lower:
                preferences["category"] = category
                break
        
        # Extract brand preferences (common car brands)
        brands = {
            "porsche": "Porsche", "bmw": "BMW", "mercedes": "Mercedes-Benz", "mercedes-benz": "Mercedes-Benz",
            "tesla": "Tesla", "audi": "Audi", "toyota": "Toyota", "honda": "Honda",
            "ford": "Ford", "chevrolet": "Chevrolet", "chevy": "Chevrolet",
            "volkswagen": "Volkswagen", "vw": "Volkswagen", "nissan": "Nissan",
            "volvo": "Volvo", "subaru": "Subaru", "hyundai": "Hyundai",
            "kia": "Kia", "genesis": "Genesis", "lexus": "Lexus",
            "dodge": "Dodge", "jeep": "Jeep", "gmc": "GMC", "buick": "Buick",
            "cadillac": "Cadillac", "lincoln": "Lincoln", "acura": "Acura",
            "infiniti": "Infiniti", "mazda": "Mazda", "mitsubishi": "Mitsubishi"
        }
        
        for keyword, brand in brands.items():
            if keyword in text_lower:
                preferences["preferred_brand"] = brand
                break
        
        # Extract budget (simple number extraction)
        budget_matches = re.findall(r'\$?(\d+,?\d*)', text)
        if budget_matches:
            try:
                budget = float(budget_matches[0].replace(',', ''))
                if budget > 1000:  # Assume purchase budget if over 1000
                    preferences["budget"] = budget
                else:  # Assume daily rental rate
                    preferences["budget"] = budget
            except ValueError:
                pass
        
        return preferences

    async def process_message(
        self,
        user_input: str,
        form_data: dict | None = None,
    ) -> dict[str, Any]:
        
        a2ui_events: list[dict[str, Any]] = []
        text_response = ""

        # Handle checkout-related form data first
        if form_data and "checkout_car_id" in form_data and "checkout_confirmed" not in form_data:
            return self._handle_checkout(form_data)

        if form_data and "checkout_confirmed" in form_data:
            return self._handle_checkout_confirmation(form_data)

        # Handle preference form submission
        if form_data and ("intent" in form_data or "category" in form_data or "budget" in form_data):
            # Validate required fields
            if not form_data.get('category') or not form_data.get('budget'):
                text_response = "Please fill in the category and budget fields in the form to proceed."
                
                # Show the form again
                a2ui_events.append({
                    "a2ui_type": "RENDER_MCP_APP",
                    "app": MCPPreferenceFormApp().model_dump(),
                })
                
                return {
                    "text": text_response,
                    "a2ui_events": a2ui_events,
                    "current_state": self.state,
                }
            
            self.user_preferences = form_data
            self.state = "RESEARCH"
            trace_agent_step("interview_complete", {"preferences": form_data})

        # If no user input (initial chat open), show form without greeting
        if not user_input or user_input.strip() == "":
            # Only show form if we're in INTERVIEW state and form not shown
            if self.state == "INTERVIEW" and not self.form_shown:
                a2ui_events.append({
                    "a2ui_type": "RENDER_MCP_APP",
                    "app": MCPPreferenceFormApp().model_dump(),
                })
                self.form_shown = True
            else:
            
            text_response = ""
            
            # Only return early if we're still in INTERVIEW state
            # If we're in RESEARCH state (from form submission), continue to research logic
            if self.state == "INTERVIEW":
                return {
                    "text": text_response,
                    "a2ui_events": a2ui_events,
                    "current_state": self.state,
                }
            else:

        if self.state == "INTERVIEW":
            # Always show the form in INTERVIEW state
            if not self.form_shown:
                a2ui_events.append({
                    "a2ui_type": "RENDER_MCP_APP",
                    "app": MCPPreferenceFormApp().model_dump(),
                })
                self.form_shown = True
            
            # If user provided input, let LLM handle it
            if user_input and user_input.strip():
                # Try to get LLM response for conversational interview
                llm_response = await self._get_llm_response(
                    user_input,
                    {"state": self.state, "preferences": self.user_preferences}
                )
                
                if llm_response:
                    text_response = llm_response
                else:
                    text_response = "We apologize, but our AI assistant is currently under maintenance. Please feel free to explore different options and categories that may suit your preferences."

        elif self.state == "RESEARCH":
            a2ui_events.extend(await self._run_research())
            text_response, catalog_event = await self._build_recommendations()
            a2ui_events.append(catalog_event)
            self.state = "RECOMMENDATION"

        elif self.state == "RECOMMENDATION":
            if form_data and "checkout_car_id" in form_data:
                return self._handle_checkout(form_data)
            
            # Try to get LLM response for recommendation explanation
            llm_response = await self._get_llm_response(
                user_input or "What are my recommendations?",
                {"state": self.state, "preferences": self.user_preferences}
            )
            
            if llm_response:
                text_response = llm_response
            else:
                text_response = "We apologize, but our AI assistant is currently under maintenance. Please feel free to explore different options and categories that may suit your preferences."

        elif self.state == "CHECKOUT":
            # Try to get LLM response for checkout completion
            llm_response = await self._get_llm_response(
                user_input or "I've completed the checkout.",
                {"state": self.state, "preferences": self.user_preferences}
            )
            
            if llm_response:
                text_response = llm_response
            else:
                text_response = "We apologize, but our AI assistant is currently under maintenance. Please feel free to explore different options and categories that may suit your preferences."

        return {
            "text": text_response,
            "a2ui_events": a2ui_events,
            "current_state": self.state,
        }

    def _is_preference_form(self, form_data: dict) -> bool:
        return ("intent" in form_data and 
                "category" in form_data and 
                "budget" in form_data and
                form_data.get("category") and
                form_data.get("budget"))

    async def _get_llm_response(self, user_message: str, context: dict[str, Any]) -> str:
        """Get LLM response with automatic fallback between providers"""
        if not self.use_llm:
            return None
        
        # Reset tried providers for new request
        self.tried_providers.clear()
        
        # Get provider order (preferred first, then others)
        provider_order = []
        if self.llm_provider == "anthropic":
            provider_order = ["anthropic", "gemini", "openai", "moonshot"]
        elif self.llm_provider == "gemini":
            provider_order = ["gemini", "anthropic", "openai", "moonshot"]
        elif self.llm_provider == "openai":
            provider_order = ["openai", "anthropic", "gemini", "moonshot"]
        elif self.llm_provider == "moonshot":
            provider_order = ["moonshot", "anthropic", "openai", "gemini"]
        else:
            provider_order = ["gemini", "anthropic", "openai", "moonshot"]
        
        # Try each provider in order
        for provider in provider_order:
            # Skip if this provider doesn't have a client or was already tried
            if provider in self.tried_providers:
                continue
            
            if provider == "anthropic" and not self.anthropic:
                continue
            if provider == "gemini" and not self.gemini_client:
                continue
            if provider == "openai" and not self.openai_client:
                continue
            if provider == "moonshot" and not self.moonshot_client:
                continue
            
            self.tried_providers.add(provider)
            
            try:
                # Build system prompt
                system_prompt = self._build_system_prompt(context)
                
                # Build conversation history
                messages = []
                for msg in self.conversation_history[-5:]:  # Keep last 5 messages for context
                    messages.append({"role": msg["role"], "content": msg["content"]})
                messages.append({"role": "user", "content": user_message})
                
                response_text = None
                
                # Call the appropriate provider
                if provider == "anthropic":
                    response_text = await self._call_anthropic(system_prompt, messages)
                elif provider == "gemini":
                    response_text = await self._call_gemini(system_prompt, messages)
                elif provider == "openai":
                    response_text = await self._call_openai(system_prompt, messages)
                elif provider == "moonshot":
                    response_text = await self._call_moonshot(system_prompt, messages)
                
                if response_text:
                    # Add to conversation history
                    self.conversation_history.append({"role": "user", "content": user_message})
                    self.conversation_history.append({"role": "assistant", "content": response_text})
                    return response_text
                
            except Exception as e:
                error_msg = str(e)
                trace_agent_step("llm_error", {"error": error_msg, "provider": provider})
                # Continue to next provider
                continue
        
        # All providers failed
        return None

    async def _call_anthropic(self, system_prompt: str, messages: list[dict]) -> str:
        """Call Anthropic Claude API"""
        # Convert messages to Anthropic format
        anthropic_messages = []
        for msg in messages:
            anthropic_messages.append({"role": msg["role"], "content": msg["content"]})
        
        response = self.anthropic.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=system_prompt,
            messages=anthropic_messages
        )
        
        return response.content[0].text

    async def _call_gemini(self, system_prompt: str, messages: list[dict]) -> str:
        """Call Google Gemini API using the old google.generativeai package"""
        # Build a simple prompt for Gemini
        full_prompt = f"{system_prompt}\n\n"
        
        # Add conversation history
        for msg in messages:
            role_label = "User" if msg["role"] == "user" else "Assistant"
            full_prompt += f"{role_label}: {msg['content']}\n"
        
        # Generate response using the old genai API
        response = self.gemini_client.generate_content(full_prompt)
        return response.text

    async def _call_openai(self, system_prompt: str, messages: list[dict]) -> str:
        """Call OpenAI API"""
        # Convert messages to OpenAI format
        openai_messages = []
        
        # Add system message
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        for msg in messages:
            openai_messages.append({"role": msg["role"], "content": msg["content"]})
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=1024
        )
        
        return response.choices[0].message.content

    async def _call_moonshot(self, system_prompt: str, messages: list[dict]) -> str:
        """Call Moonshot (Kimi K3) API using OpenAI-compatible interface"""
        # Convert messages to OpenAI format
        moonshot_messages = []
        
        # Add system message
        if system_prompt:
            moonshot_messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        for msg in messages:
            moonshot_messages.append({"role": msg["role"], "content": msg["content"]})
        
        response = self.moonshot_client.chat.completions.create(
            model="kimi-k3",
            messages=moonshot_messages,
            max_tokens=1024,
            reasoning_effort="high"  # Kimi K3 specific parameter
        )
        
        return response.choices[0].message.content

    def _build_system_prompt(self, context: dict[str, Any]) -> str:
        """Build system prompt based on current agent state and context"""
        state = context.get("state", self.state)
        preferences = context.get("preferences", self.user_preferences)
        
        base_prompt = """You are an AI Car Matchmaker assistant helping users find the perfect car to rent or buy. 

Your role is to:
1. Understand user preferences for car type, budget, and timeline
2. Provide helpful, conversational responses
3. Guide users through the car selection process
4. Explain your recommendations clearly

Be friendly, professional, and concise. Focus on helping the user find the best car for their needs."""
        
        if state == "INTERVIEW":
            base_prompt += f"""

Current State: Interview Phase
The user is setting their preferences. Current preferences: {preferences}
Help them clarify their needs if the information is incomplete."""
        
        elif state == "RESEARCH":
            base_prompt += """

Current State: Research Phase
You are searching for cars that match the user's criteria. This may take a moment."""
        
        elif state == "RECOMMENDATION":
            base_prompt += """

Current State: Recommendation Phase
You have found car options for the user. Present them clearly, highlighting key features and trade-offs."""
        
        elif state == "CHECKOUT":
            base_prompt += """

Current State: Checkout Phase
The user is completing a booking/purchase. Guide them through the secure mock checkout process."""
        
        return base_prompt

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
        preferred_brand = self.user_preferences.get("preferred_brand")
        self.budget_relaxed = False

        # Use hybrid data service (API + fallback to mock)
        self.last_recommendations = await hybrid_data_service.query_cars(
            category=category,
            max_budget=budget,
            is_rental=is_rental,
            preferred_brand=preferred_brand,  # Pass brand preference
        )

        # If brand preference was specified but no results, try without brand filter
        if preferred_brand and len(self.last_recommendations) == 0:
            self.last_recommendations = await hybrid_data_service.query_cars(
                category=category,
                max_budget=budget,
                is_rental=is_rental,
                preferred_brand=None,  # Search all brands
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
                    preferred_brand=preferred_brand,
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
        preferred_brand = self.user_preferences.get("preferred_brand")

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
                # Add frontend-specific fields
                "make": car.get("make", "Unknown"),
                "model": car.get("model", "Unknown"),
                "purchase_price": car.get("purchase_price", 0),
                "daily_rental_rate": car.get("daily_rental_rate", 0),
                "ev_range": car.get("ev_range", 0),
                "seating_capacity": car.get("seating_capacity", 5),
            })

        tradeoff = self._build_tradeoff_matrix(catalog_items, is_rental)
        price_range = hybrid_data_service.get_category_price_range(category)

        if not catalog_items:
            min_price = price_range["min_rental"] if is_rental else price_range["min_purchase"]
            text = (
                f"No {category} cars found within your budget of ${budget:,.0f} "
                f"({'rental/day' if is_rental else 'purchase'}). "
                f"Prices in this category start at ${min_price:,.0f}. "
                "Try increasing your budget or switching to Rent if you meant a daily rate."
            )
        elif self.budget_relaxed:
            min_price = price_range["min_rental"] if is_rental else price_range["min_purchase"]
            text = (
                f"Your budget of ${budget:,.0f} is below the minimum "
                f"${min_price:,.0f} for {category} "
                f"({'rental/day' if is_rental else 'purchase'}). "
                "Showing the best available options in your category instead:"
            )
        else:
            # Simple text without extra explanations
            text = f"Found {len(catalog_items)} options for {category if category else 'all categories'} under ${budget:,.0f} ({'Rental/day' if is_rental else 'Purchase'})."

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
            f"{top_rated['title']} offers the highest rating ({top_rated['rating']}/5), "
            f"while {best_value['title']} is the best value "
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
            "text": f"Opening secure, mocked payment gateway for {car_name}...",
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

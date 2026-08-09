# AI Car Matchmaker - Demo Video Script (Final)

**Duration:** 4-5 minutes
**Format:** Screen recording with voiceover
**Goal:** Demonstrate all key features in a clear, logical flow

---

## Step 1: Introduction (0:00 - 0:30)

**WHAT TO SHOW:**
1. Full landing page with hero section
2. Fleet section with various cars visible
3. Navigation bar at top (Fleet, Locations, About)

**WHAT TO SAY:**
"Welcome to MATCH MY DRIVE, an AI-powered car matchmaker that helps you find the perfect car to rent or buy. This application demonstrates advanced multistep AI agent orchestration, MCP Apps integration, and generative UI using the A2UI protocol."

---

## Step 2: Open AI Assistant (0:30 - 1:00)

**WHAT TO SHOW:**
1. Click the "AI Matchmaker" button in the top right corner
2. Watch the chat panel slide in from the right
3. Point to the greeting message
4. Point to the MCP Preference Form App below the greeting
5. Point to each field: Intent buttons, Category dropdown, Budget input, Date picker, Submit button

**WHAT TO SAY:**
"Let's start by opening the AI assistant. The chat panel slides in with a greeting and an interactive MCP Preference Form App. This form is a **mandatory MCP App** as per the hackathon requirements - it's rendered using the MCP Apps protocol directly inside the chat interface, allowing users to specify their preferences in a structured way while still maintaining conversational flexibility."

---

## Step 3: Fill and Submit Form (1:00 - 1:30)

**WHAT TO SHOW:**
1. Click "Rent" in the Intent section
2. Click the Category dropdown and select "Sedan"
3. Type "150" in the Budget field
4. Click the Target Date field and select a date
5. Click "Submit Preferences" button
6. Watch the page automatically scroll down to the fleet section
7. Notice the chat panel stays open

**WHAT TO SAY:**
"I'll specify my preferences: I want to rent a Sedan with a daily budget of $150. After submitting, the page automatically scrolls to the fleet section while keeping the chat open. This seamless integration shows how the A2UI protocol enables dynamic UI interactions driven by agent events."

---

## Step 4: Watch Research Phase (1:30 - 2:00)

**WHAT TO SHOW:**
1. Look at the chat panel showing status messages:
   - "Analyzing user preferences" (with checkmark)
   - "Searching marketplace (real-time API + DB)..." (with checkmark)
   - "Ranking trade-offs & generating match scores" (with checkmark)
2. Watch cars appearing in the fleet section
3. Point to the newly appeared cars

**WHAT TO SAY:**
"The agent now enters the research phase. Through A2UI UPDATE_STATUS events, you can see the agent's reasoning in real-time: analyzing preferences, searching the marketplace using our hybrid data service that combines Auto.dev API with a local database, and ranking options based on trade-offs. The cars appear in the fleet section as recommendations are generated."

---

## Step 5: View Car Details (2:00 - 2:45)

**WHAT TO SHOW:**
1. Click on any car card to open the detail modal
2. Point to the trade-off matrix section
3. Point to "Top Choice" label and explanation
4. Point to "Value Choice" label and explanation
5. Point to the car specs (daily rate, features, rating)
6. Close the modal by clicking the X button

**WHAT TO SAY:**
"The agent presents ranked recommendations with a trade-off matrix. The Top Choice represents the best overall match for your preferences, while the Value Choice offers the best bang for your buck. Each recommendation includes detailed specs, pricing, and reasoning to help you make an informed decision."

---

## Step 6: Complete Checkout (2:45 - 3:30)

**WHAT TO SHOW:**
1. Click "Rent Now" button on a car card
2. Watch the checkout modal appear
3. Point to the MCP Checkout App with payment fields
4. Type in cardholder name (e.g., "John Doe")
5. Type in mock card number (e.g., "4242 4242 4242 4242")
6. Type in expiry date (e.g., "12/25")
7. Type in CVV (e.g., "123")
8. Click "Pay [Amount] (Mock)" button
9. Watch the success message appear

**WHAT TO SAY:**
"When you're ready to book, the checkout process happens entirely within the chat interface using another **mandatory MCP App** - the MCP Checkout App. This is a fully mocked payment interface for demonstration purposes, as required by the hackathon. The checkout includes all necessary fields but processes no real payments, ensuring a safe sandbox environment for testing."

---

## Step 7: Try Natural Language Chat (3:30 - 4:00)

**WHAT TO SHOW:**
1. Type in the chat input: "What's the difference between the top two cars?"
2. Wait for the agent response (or maintenance message if LLM unavailable)
3. Point out that the form is still visible below
4. Type in the chat: "Show me SUVs instead"
5. Watch the fleet section update with SUV cars

**WHAT TO SAY:**
"Beyond the form, you can also interact with the agent using natural language. The form remains visible for structured input, while the chat handles conversational queries. The agent supports multiple LLM providers with automatic fallback, ensuring reliability even if one provider is unavailable."

---

## Step 8: Try Category Filtering (4:00 - 4:30)

**WHAT TO SHOW:**
1. Click on different category tabs: SUV, Sports, EV, Luxury
2. Point out that these cars come from the real Auto.dev API
3. Point out they have real images from the API
4. Click on "All" category
5. Point out this shows variety from the local database across all categories

**WHAT TO SAY:**
"The application uses a hybrid data service. When you select specific categories like Sedan or SUV, it queries the real Auto.dev API for actual market listings with authentic images. For the 'All' category, it uses the local database to ensure variety across all categories. This approach balances real-time data with comprehensive coverage."

---

## Step 9: Show Technical Details (4:30 - 5:00)

**WHAT TO SHOW:**
1. Switch to the backend terminal window
2. Point to the logs showing OpenTelemetry traces
3. Point to agent steps like "interview_complete", "research_start", "research_complete"
4. Show the docker-compose.yml file
5. Show the Dockerfile
6. Show the GitHub repository page
7. Switch back to the browser showing the landing page

**WHAT TO SAY:**
"The entire agent flow is instrumented with OpenTelemetry and integrated with Langfuse for observability. You can trace agent steps, tool calls, and LLM interactions to debug and evaluate the agent's reasoning. The application is fully containerized with Docker and docker-compose, making it easy to deploy anywhere. The complete source code, architecture documentation, and setup instructions are available on GitHub.

**Key compliance note:** The implementation includes both mandatory MCP Apps as required - the Preference Form App for structured input and the Checkout App for mock payment processing, both rendered directly inside the chat interface using the MCP Apps protocol."

---

## ENDING

**WHAT TO SHOW:**
- Final shot of the landing page with the tagline "Find Your Perfect Car Match"

**WHAT TO SAY:**
"MATCH MY DRIVE demonstrates advanced multistep agent orchestration, MCP Apps integration, and generative UI using the A2UI protocol. It's ready for deployment and showcases the power of AI agents in real-world applications."

---

## QUICK REFERENCE

**Key Features to Mention:**
- Multistep agent: INTERVIEW → RESEARCH → RECOMMENDATION → CHECKOUT
- MCP Apps: Preference Form + Checkout
- A2UI Protocol: Dynamic UI updates
- Hybrid Data Service: Auto.dev API + local database
- Multi-LLM Support: Anthropic, Gemini, OpenAI, Kimi K3
- Observability: OpenTelemetry + Langfuse
- Full-Stack: React + FastAPI + SQLite
- Docker containerization

**Technical Terms to Emphasize:**
- MCP Apps (Model Context Protocol)
- A2UI (Agent-to-UI Protocol)
- OpenTelemetry
- State machine
- Tool calling
- Hybrid data service

---

## RECORDING TIPS

1. **Speak clearly and at a moderate pace**
2. **Pause briefly between steps** to let viewers absorb information
3. **Point to specific UI elements** with your mouse cursor
4. **Zoom in if needed** for small text
5. **Wait for animations** to complete before moving on
6. **Keep energy positive and professional**

---

## ESTIMATED TIMING

- Introduction: 30 seconds
- Open Assistant: 30 seconds
- Form Submission: 30 seconds
- Research Phase: 30 seconds
- Car Details: 45 seconds
- Checkout: 45 seconds
- Natural Language: 30 seconds
- Category Filtering: 30 seconds
- Technical Details: 30 seconds

**Total: 4 minutes 30 seconds**

---

## CHECKLIST BEFORE RECORDING

- [ ] Backend running (http://localhost:8000)
- [ ] Frontend running (http://localhost:3002)
- [ ] Browser cleared cache
- [ ] Recording software ready
- [ ] Audio tested
- [ ] Terminal window open for logs
- [ ] GitHub repository open
- [ ] Read through this script once

---

## COMMON MISTAKES TO AVOID

- Don't skip steps - show each one in order
- Don't rush - let animations complete
- Don't forget to point to key elements
- Don't speak too fast
- Don't forget to show both browser and terminal
- Don't exceed 5 minutes total

---

Good luck with your recording! 🎬

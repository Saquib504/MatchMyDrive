# Demo Recording Checklist

## Pre-Recording Setup

### 1. Start Services
```bash
# Terminal 1: Backend
cd /Users/mohdsaquib/Projects/ai-car-matchmaker/backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd /Users/mohdsaquib/Projects/ai-car-matchmaker/frontend
npm run dev
```

### 2. Verify Services
- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:3002
- [ ] Health check: http://localhost:8000/health returns OK
- [ ] Browser can access http://localhost:3002

### 3. Prepare Browser
- [ ] Clear browser cache
- [ ] Open browser in full screen (Cmd+F on Mac)
- [ ] Zoom browser to 100%
- [ ] Open DevTools for backend logs (optional)
- [ ] Close unnecessary tabs

### 4. Recording Software Setup
- [ ] Open screen recording software (OBS, Loom, QuickTime, etc.)
- [ ] Set recording area to browser window
- [ ] Test audio recording
- [ ] Set recording quality to 1080p or higher
- [ ] Enable mouse click highlighting (if available)

## Recording Checklist

### Scene 1: Introduction (0:00-0:30)
- [ ] Landing page visible
- [ ] Hero section with tagline
- [ ] Fleet section showing cars
- [ ] Navigation bar visible

### Scene 2: Opening AI Assistant (0:30-1:00)
- [ ] Click "AI Matchmaker" button
- [ ] Chat panel slides in
- [ ] Greeting message appears
- [ ] MCP Preference Form App appears
- [ ] Form fields visible (Intent, Category, Budget, Date)

### Scene 3: Form Submission (1:00-1:30)
- [ ] Select "Rent" intent
- [ ] Select "Sedan" category
- [ ] Enter "150" budget
- [ ] Select target date
- [ ] Click "Submit Preferences"
- [ ] Page scrolls to fleet section
- [ ] Chat stays open

### Scene 4: Research Phase (1:30-2:00)
- [ ] Status messages appear in chat
- [ ] Checkmarks appear as steps complete
- [ ] Cars appear in fleet section
- [ ] Research completes successfully

### Scene 5: Recommendations (2:00-2:45)
- [ ] Click on a car card
- [ ] Detail modal opens
- [ ] Trade-off matrix visible
- [ ] Top Choice vs Value Choice
- [ ] Close modal

### Scene 6: Checkout (2:45-3:30)
- [ ] Click "Rent Now" on a car
- [ ] Checkout modal appears
- [ ] MCP Checkout App visible
- [ ] Fill in payment fields
- [ ] Click "Pay [Amount] (Mock)"
- [ ] Success message appears

### Scene 7: Natural Language Chat (3:30-4:00)
- [ ] Type: "What's the difference between the top two cars?"
- [ ] Agent responds (or shows maintenance message)
- [ ] Form still visible
- [ ] Type: "Show me SUVs instead"
- [ ] Fleet updates with SUVs

### Scene 8: Category Filtering (4:00-4:30)
- [ ] Click different category tabs
- [ ] Show API cars with real images
- [ ] Switch to "All" category
- [ ] Show database cars with variety

### Scene 9: Observability (4:30-5:00)
- [ ] Show backend terminal with logs
- [ ] Show OpenTelemetry traces
- [ ] Show Docker files
- [ ] Show GitHub repository
- [ ] Final landing page shot

## Post-Recording

### 1. Video Editing
- [ ] Trim unnecessary parts
- [ ] Add smooth transitions
- [ ] Add intro/outro if desired
- [ ] Add background music (optional, low volume)
- [ ] Export in MP4 format
- [ ] Ensure file size is reasonable (< 500MB)

### 2. Quality Check
- [ ] Audio is clear and audible
- [ ] Video is sharp at 1080p+
- [ ] Text is readable
- [ ] Pacing is appropriate
- [ ] Total duration: 4-5 minutes

### 3. Upload
- [ ] Upload to YouTube (unlisted or public)
- [ ] Copy video URL
- [ ] Add URL to README.md
- [ ] Add URL to slide deck

## Troubleshooting

### If backend fails to start
```bash
# Check dependencies
cd backend
pip install -r requirements.txt

# Check .env file
cat .env
```

### If frontend fails to start
```bash
# Install dependencies
cd frontend
npm install

# Check API_URL in .env
echo $VITE_API_URL
```

### If LLM returns maintenance message
- This is expected if API keys are not configured
- Explain in voiceover that this demonstrates graceful fallback
- Continue with the demo - the form still works

### If Auto.dev API fails
- Hybrid service will fallback to database
- Explain this demonstrates robust error handling
- Continue with demo

### If screen recording software crashes
- Restart and begin from the last completed scene
- You can skip completed scenes in post-production

## Notes for Voiceover

- Speak clearly and at a moderate pace
- Pause briefly between scenes
- Emphasize key technical terms (MCP Apps, A2UI, OpenTelemetry)
- Keep energy positive and professional
- Mention the hackathon context
- Highlight the innovative features

## Estimated Recording Time

- Setup: 5 minutes
- Recording: 10-15 minutes (with retakes)
- Editing: 10-15 minutes
- Upload: 5 minutes

**Total: 30-40 minutes**

## Success Criteria

✅ Video shows all core features
✅ MCP Apps are clearly demonstrated
✅ A2UI protocol is visible
✅ Audio is clear
✅ Video is 4-5 minutes
✅ Technical details are explained
✅ Application is shown working end-to-end

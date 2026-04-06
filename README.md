# Conniku

Conniku is an AI-powered study assistant platform designed to help university students optimize their learning through intelligent multi-modal interactions.

## Architecture

Conniku employs a modern, highly scalable architecture:
- **Frontend**: React + Vite (TypeScript). Includes features for offline access and PWA support.
- **Desktop & Mobile**: Pre-configured with Electron (Mac/Windows) and Capacitor (iOS/Android).
- **Backend**: FastAPI (Python) serving REST APIs. Employs async capabilities with heavy integration to Anthropic's Claude to process audio, study notes, generate flashcards, and solve math.
- **Data storage**: SQLite via SQLAlchemy (migration tools included).

## Project Structure

```
├── backend/            # FastAPI backend logic and Python dependencies
├── src/                # React source code (Pages, Components, Contexts)
├── docs/               # Visual design templates and previews
├── electron/           # configuration for Electron app
├── android/            # Capacitor configuration for Android 
├── ios-assets/         # iOS app assets
└── public/             # Public static assets
```

## Running Locally

### 1. Backend Setup

The backend depends on Python 3.

```bash
# Navigate to project 
cd CONNIKU

# It is recommended to use a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip3 install -r backend/requirements.txt

# Start the server (runs on port 8899 or 8000 depending on config)
npm run backend:start
```

### 2. Frontend Setup

Make sure you have Node > 18.x installed.

```bash
# Install NPM dependencies
npm install

# Run the local frontend dev server
npm run dev:renderer
```

Or just run both concurrently via:
```bash
npm run dev
```

## Mobile Development

We use Capacitor to sync web bundles with mobile native projects:

```bash
# Sync new changes
npm run mobile:sync

# Run on Android
npm run mobile:run:android

# Run on iOS
npm run mobile:run:ios
```

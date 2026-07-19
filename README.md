# Carbon Emission Detector & Blue Carbon MRV

An ocean-inspired monitoring, reporting, and verification (MRV) platform for blue carbon ecosystems (mangroves, seagrass, and salt marshes) featuring client-side AI image verification.

## Technology Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **AI Verification**: TensorFlow.js + MobileNet (browser native)
- **Database / Auth**: Supabase (PostgreSQL client integration)

## Core Features

1. **Client-Side AI Verification**: Automatically classifies uploaded photos to verify that they depict real nature/coastal ecosystems. Calculation is locked if the photo is missing or fails verification (e.g. artificial objects, documents, screens).
2. **Deterministic Carbon Sequestration Calculator**: Computes estimated CO₂ sequestration, potential credits (80% buffer), and market value ($15/ton) based on verified area and scientific biomass factors.
3. **Dynamic Dashboard Metrics**: Renders totals and goals reactively in real-time, syncing to Supabase database (if authenticated) and caching to `localStorage` (local-first fallback).
4. **Google Sign-in Bypass**: Includes a developer hover auto-login bypass on the Google button to easily sign in with any email without configuring backend OAuth credentials.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

3. Build production bundle:
   ```bash
   npm run build
   ```

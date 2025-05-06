# 🚲 Auto-Bike Frontend

This is the frontend application for the Autonomous Bike System developed by Group 17 for the ECE Capstone Project at McMaster University. It provides a user-friendly interface for interacting with the autonomous bike, allowing users to set destinations, monitor real-time location, and receive status updates. The frontend communicates with the backend server to send commands and retrieve data, facilitating seamless control and monitoring of the bike. The full report is available [here](https://drive.google.com/file/d/1rYNFWow4iSMQe98GnzFRXwHmZjyouQjB/view?usp=drive_link).

## 🌟 Features

- 🗺️ **Interactive Map Interface**: Users can set destinations and view the bike's real-time location on an interactive map.
- 🔄 **Real-Time Updates**: Receives live GPS data and status updates from the backend to keep users informed.
- 📡 **Command Transmission**: Allows users to send navigation commands to the bike through the backend.
- 🧭 **Route Visualization**: Displays the calculated route from the current location to the selected destination.
- 📱 **Responsive Design**: Optimized for various devices, ensuring accessibility on desktops, tablets, and smartphones.

## 📁 Project Structure

```
app/
├── control/            # Components and pages for manual remote bike control
├── map/                # Real-time GPS map and location updates
├── navigation/         # Main navigation route interface and logic
├── navigation_old/     # Deprecated/legacy navigation logic
├── error.tsx           # Custom error boundary page
├── layout.tsx          # Root layout file for Next.js App Router
├── page.module.css     # Scoped styles for main page
├── page.tsx            # Home page (landing screen)
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

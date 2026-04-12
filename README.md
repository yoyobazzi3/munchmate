# MunchMate 🍽️

MunchMate is a personalized, AI-powered restaurant discovery platform built to help you find your next favorite meal securely and effortlessly. Rather than endlessly scrolling through lists, MunchMate combines your exact geographical location, stored dietary flavor preferences, and budget tolerances to intelligently curate dining recommendations just for you.

If you don't know what you are craving, seamlessly switch over to our interactive **MunchMate AI Chatbot**! Tell it your mood, vibe, or obscure craving, and our AI assistant will recommend the perfect spot nearby. 

## 🌟 Key Features
- **Intelligent Geolocation:** Automatically calculates distances and search radii utilizing the browser's native location API and Nominatim reverse-geocoding.
- **Preference-Driven Curation:** Save your favorite cuisines and ideal price ranges in your user profile to get uniquely tailored "Recommended For You" feeds on the homepage.
- **AI Food Assistant:** A persistent markdown-supported Chatbot that understands conversational context to act as your personalized digital concierge.
- **Deep Filtering:** A comprehensive interactive sidebar allowing you to slice through thousands of queries based on minimum ratings, operating hours, distances, and specific dining formats. 
- **Interactive Maps & Galleries:** Powered by `react-leaflet`, view your destination on an embedded interactive map directly alongside sprawling photo gallery highlights.
- **Battle-Tested Security:** Employs industry-standard JWT authentication transported securely via backend-assigned HttpOnly cookies to protect your session entirely from the client side.

---

## 🏗️ Architecture Stack

This repository uses a thoroughly documented, decoupled architecture.

### **Frontend** (`/food-frontend`)
- **Framework:** React + Vite
- **Styling:** Custom component-scoped vanilla CSS
- **Routing & State:** `react-router-dom`, React Context API, and localized custom hooks.
- **Mapping:** `react-leaflet` with OpenStreetMap.

### **Backend** (`/backend`)
- **Server:** Node.js with Express.js
- **Architecture:** Layered MVC (Model-View-Controller) structure utilizing Abstract Repositories and isolated Services.
- **Database:** MySQL
- **Authentication:** `jsonwebtoken` (JWTs), bcrypt, securely passing `HttpOnly` refresh and access cookies.

---

## 🚀 Getting Started

Follow these steps to run both the frontend UI and the backend API architecture locally.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/munchmate.git
cd munchmate
```

### 2. Set up the Backend
```bash
# Navigate to the backend directory
cd backend

# Install all Node dependencies
npm install

# Setup your Environment Variables
# Create a .env file locally in the backend directory based on a .env.example if provided, including:
# - DB_HOST, DB_USER, DB_PASS, DB_NAME (for MySQL)
# - PORT (defaults to 3000)
# - FRONTEND_URL (defaults to http://localhost:5173 for CORS)
# - JWT_SECRET and JWT_REFRESH_SECRET
# - Yelp API Key / AI API keys

# Start the development server (runs with nodemon)
npm run dev
```

### 3. Set up the Frontend
Open a new terminal window/tab:
```bash
# Navigate to the frontend directory
cd food-frontend

# Install all React/Vite dependencies
npm install

# Setup your Environment Variables
# Create a .env file locally in the food-frontend directory. Include:
# VITE_BACKEND_URL=http://localhost:3000

# Start the Vite development server
npm run dev
```

### 4. Open the App!
Navigate to `http://localhost:5173` in your browser. Create an account, input your geographic location, populate your profile preferences, and let our AI handle the rest!

---

## 📖 Code Documentation
The codebase is heavily commented out of the box using standardized **JSDoc blocks** making it exceptionally easy to ramp up.
- **Backend:** Models, Repositories, Controllers, and utility functions are explicitly typed and annotated.
- **Frontend:** API wrapper services, UI building blocks (in `src/components`), hooks, and context stores are thoroughly documented for rapid iterative reading.

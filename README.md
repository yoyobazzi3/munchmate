**MunchMate**

AI‑powered restaurant discovery that serves you hyper‑personalized dining picks based on your cravings, location, and budget.

---

**🚀 Tech Stack**

| Layer        | Technology                                                                                |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Frontend** | React (Create‑React‑App), Axios                                                           |
| **Backend**  | Node.js, Express, Passport (Google OAuth 2.0)                                             |
| **Database** | MySQL 8 (mysql2 driver)                                                                   |
| **AI / APIs**| Yelp Fusion • Google Maps + Geocoding • Google Gemini (@google/generative‑ai) • OpenAI SDK |
| **Auth**     | bcryptjs, jsonwebtoken                                                                    |
| **Middleware** | cors, morgan                                                                            |

---

**📂 Project Structure**

```text
munchmate/
├── backend/
│   ├── src/
│   ├── .env          # backend environment
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env          # frontend environment
│   └── package.json
└── README.md

//bash
# 1  Clone the repo
git clone git@github.com:yoyobazzi3/munchmate.git
cd munchmate
//


//bash
# 2  Install ALL backend dependencies in one shot
cd backend
npm install @google/generative-ai axios bcryptjs cors express jsonwebtoken morgan mysql2 \
            passport passport-google-oauth20 openai
# (or simply: npm install   if package.json already lists everything)

# 3  Create environment file
cp .env.example .env
nano .env            # fill in DB credentials + API keys

# 4  Launch the API
npm run dev          # nodemon hot‑reload
# → listening on http://localhost:8000
//
.env
//bash
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=changeme
DB_PORT=3306
DB_NAME=munchmate

HOST=localhost
PORT=8000

JWT_SECRET=supersecret

YELP_API_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
//



Frontend
bash//
# 5  Install client deps
cd ../frontend
npm install

# 6  Configure client‑side env vars
cp .env.example .env
nano .env            # backend URL + Google keys

# 7  Run React dev server
npm start            # opens http://localhost:3000
//

.env
bash//
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_API_KEY=
REACT_APP_GOOGLE_GEOCODING_API_KEY=
//

# NutriFit — Fitness & Nutrition Health App

**FAU Biomedical Hackathon** · Built by Lucas Fracasso Custodio & NathAnael Castro

NutriFit is a health and wellness web app that helps you organize nutrition and fitness goals, plan meals, and get personalized guidance from **Berry**, an AI assistant. Everything is designed to be practical, beginner-friendly, and backed by clear, actionable advice.

---

## What NutriFit Does

- **Sign in** — Simple onboarding with first and last name  
- **Home** — Welcome dashboard with app overview and quick access to Berry and cards  
- **Ask Berry** — AI assistant for nutrition, workouts, meal plans, and wellness (no medical advice)  
- **Nutri Cards** — Create and organize meals by day/time with macros (carbs, protein, fat) and meal details  
- **Fit Cards** — Placeholder for exercise cards (Create Exercise Card in header)  
- **Weekly Calendar** — View your Nutri Cards in a weekly layout  
- **AI Notes & Contact** — Planned features (links in header)

---

## Project Structure

```
FAU-Biomedical-Hackathon/
├── frontend/                 # Main web app (Express + EJS)
│   ├── index.js              # Frontend server, routes, static files
│   ├── package.json
│   ├── public/
│   │   ├── images/
│   │   ├── js/               # e.g. calendar.js
│   │   └── styles/           # CSS per page
│   └── views/
│       ├── signin.ejs
│       ├── index.ejs         # Home
│       ├── create-nutricard.ejs
│       ├── calendar.ejs
│       └── partials/
│           └── header.ejs
├── backend/                  # AI API (Express + OpenAI)
│   ├── server.js             # API server
│   ├── package.json
│   ├── routes/
│   │   └── aiRoutes.js       # /api/ai/* endpoints
│   ├── services/
│   │   └── aiService.js      # OpenAI + Berry logic
│   ├── README.md             # Backend-specific docs
│   └── SETUP.md              # Backend setup & examples
└── README.md                 # This file
```

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Node.js, Express, EJS, jQuery |
| Backend  | Node.js, Express, OpenAI API  |
| Styling  | Custom CSS                    |
| Data     | In-memory (session-style)     |

---

## Berry AI — Rules & Features

Berry is a **fitness and nutrition assistant**. It:

- Gives personalized fitness and nutrition tips, meal ideas, and simple workout plans  
- Uses clear, supportive language and actionable steps  
- Favors short lists and flexible, beginner-friendly plans  
- **Does not** give medical diagnoses, treatment, or replace doctors or dietitians  
- Avoids extreme diets, unsafe workouts, or unrealistic goals  
- Stresses **consistency over intensity** and progress over time  

---

## Main User Flows

1. **Sign in** → **Home** → browse NutriFit, use **Ask Berry**, or go to **Create Nutri Card**.  
2. **Create Nutri Card** → set title, day, time, macros, base/main/side/extras → **Calendar**.  
3. **Calendar** → view Nutri Cards by day.  
4. **Header** → **Weekly Calendar**, **Create Exercise Card**, **Create Nutri Card**, **Ask Berry**, **AI Notes**, **Contact Us**.

---



## Safety & Disclaimers

- NutriFit and Berry provide **general wellness, nutrition, and fitness information** only.  
- **Not medical or professional advice.** Always consult a doctor, dietitian, or qualified professional for health, diet, or exercise decisions.  
- Use NutriFit and Berry at your own responsibility.

---

## Possible Next Steps

- Connect **Ask Berry** on the home page to the backend API.  
- Add **Create Exercise Card** / Fit Card flows and calendar integration.  
- Add **AI Notes** and **Contact** pages.  
- Add more fitness/nutrition APIs (e.g. exercise DB, food DB).  
- Add simple auth and persistence (DB) for users and cards.

---

## License

ISC · Lucas Fracasso Custodio & Nathanael Castro.
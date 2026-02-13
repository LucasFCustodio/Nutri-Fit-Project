# NutriFit Backend -- Developer Reference

Internal reference for developers working on the NutriFit backend. Covers setup, architecture, every route, middleware chains, schemas, DB operations, and error handling.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Startup Sequence](#startup-sequence)
- [File Map](#file-map)
- [Dependency Graph](#dependency-graph)
- [Request Pipeline](#request-pipeline)
- [Page Routes](#page-routes-indexjs)
- [API Routes: /api/ai/*](#api-routes-apiai-airoutesjs)
- [API Routes: /api/ninjas/*](#api-routes-apininjas-apininjaroutesjs)
- [Rate Limiting](#rate-limiting)
- [Validation Middleware](#validation-middleware)
- [Joi Schemas](#joi-schemas)
- [Database Schema](#database-schema-supabase-postgresql)
- [DB Operations by Route](#database-operations-by-route)
- [AI Service (Berry)](#ai-service----berry-aiservicejs)
- [API Ninja Service](#api-ninja-service-apininjaservicejs)
- [Error Flows](#error-flows)

---

## Environment Variables

All vars live in `backend/.env`. Loaded via `dotenv.config({ path: 'backend/.env' })` in `index.js`.

> **Never commit `backend/.env`** -- API keys must stay out of version control.

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | **YES** | Supabase project URL |
| `SUPABASE_ANON_KEY` | **YES** | Supabase anon/public key (fallback: `SUPABASE_API_KEY`) |
| `OPENAI_API_KEY` | **YES** | OpenAI API key for Berry chat |
| `EXERCISE_API_KEY` | **YES** | API Ninjas key (also fallback for NUTRITION/RECIPE keys) |
| `NUTRITION_API_KEY` | no | Separate nutrition key (defaults to `EXERCISE_API_KEY`) |
| `RECIPE_API_KEY` | no | Separate recipe key (defaults to `EXERCISE_API_KEY`) |
| `OPENAI_MODEL` | no | Model name (default: `gpt-3.5-turbo`) |
| `OPENAI_MAX_TOKENS_CHAT` | no | Token cap for chat/wellness (default: `350`) |
| `OPENAI_MAX_TOKENS_PLANS` | no | Token cap for workout/meal plans (default: `550`) |
| `PORT` | no | Server port (default: `3000`) |
| `RATE_LIMIT_WINDOW_MS` | no | Rate limit window in ms (default: `900000` = 15 min) |
| `RATE_LIMIT_MAX_GENERAL` | no | General limit (default: `200`) |
| `RATE_LIMIT_MAX_POST` | no | POST limit (default: `50`) |
| `RATE_LIMIT_MAX_AI` | no | AI limit (default: `20`) |

---

## Startup Sequence

What happens when you run `node index.js`:

```
1.  dotenv.config({ path: 'backend/.env' })          // load env
2.  app.set('view engine', 'ejs')                     // views/ directory
3.  app.use(generalLimiter)                            // IP rate limit on ALL routes
4.  app.use(bodyParser.urlencoded({ extended: true })) // form bodies
5.  app.use(express.json())                            // JSON bodies for API routes
6.  // -- page routes registered (GET /, POST /home, etc.) --
7.  app.use(express.static('public'))                  // static AFTER page routes
8.  app.use('/api/ai', aiLimiter, aiRoutes)            // AI API router
9.  app.use('/api/ninjas', postLimiter, apiNinjaRoutes) // Ninja API router
10. app.use(404 => redirect('/'))                      // catch-all 404
11. app.listen(PORT)                                   // default 3000
```

> **Order matters:** Page routes are registered _before_ `express.static` so `GET /` hits the sign-in handler, not a static file. API routers are mounted after static.

---

## File Map

```
Nutri-Fit-Project/
├── index.js                        # Express server, all page routes, startup
├── package.json                    # deps: express 5.2, openai, @supabase/supabase-js, axios, joi, ejs
│
├── backend/
│   ├── .env                        # API keys, DB creds, config (NEVER COMMIT)
│   ├── README.md                   # <-- you are here
│   ├── config/
│   │   └── schemas.js              # All Joi schemas (signIn, cards, askBerry, API schemas)
│   ├── db/
│   │   └── supabase.js             # createClient(), Proxy stub if env missing
│   ├── middleware/
│   │   ├── rateLimit.js            # generalLimiter(200), postLimiter(50), aiLimiter(20)
│   │   └── validate.js             # validateBody(), validateParams(), validateQuery()
│   ├── routes/
│   │   ├── aiRoutes.js             # /api/ai/* (chat, workout-plan, meal-plan, wellness-advice)
│   │   └── apiNinjaRoutes.js       # /api/ninjas/* (nutrition, recipes, exercises)
│   └── services/
│       ├── aiService.js            # OpenAI calls + SYSTEM_PROMPT + fallback responses
│       └── apiNinjaService.js      # axios calls to api-ninjas.com endpoints
│
├── views/                          # EJS templates
│   ├── partials/header.ejs         # Shared nav
│   ├── signin.ejs
│   ├── index.ejs                   # Home dashboard
│   ├── calendar.ejs                # Weekly calendar
│   ├── ask-berry.ejs               # Berry chatbot
│   ├── create-nutricard.ejs
│   ├── create-fitcard.ejs
│   ├── create-recoverycard.ejs
│   ├── card-details.ejs
│   └── about-us.ejs
│
├── public/                         # Static assets
│   ├── js/signin.js                # Client-side form validation
│   ├── js/supabaseClient.js
│   ├── styles/                     # Per-page CSS files
│   └── images/
│
└── Tests/                          # test-endpoints.js, test-berry-console.js, chat-berry.js
```

---

## Dependency Graph

Who imports what:

```
index.js
├── services/aiService.js
├── db/supabase.js
├── middleware/rateLimit.js
├── middleware/validate.js
├── config/schemas.js
├── routes/aiRoutes.js
│   ├── services/aiService.js
│   ├── middleware/validate.js
│   └── config/schemas.js
└── routes/apiNinjaRoutes.js
    ├── services/apiNinjaService.js
    ├── middleware/validate.js
    └── config/schemas.js

services/aiService.js     → openai (npm), dotenv
services/apiNinjaService.js → axios (npm), dotenv
db/supabase.js            → @supabase/supabase-js, dotenv
```

---

## Request Pipeline

Every request flows through a middleware chain. Middleware short-circuits on failure (returns error response, never reaches handler).

**Page Route** (e.g. `POST /calendar`):

```
Request → generalLimiter → postLimiter → validateBody(schema) → Route Handler → Supabase .insert() → res.render(EJS)
          (200/15min)       (50/15min)    Joi + stripUnknown      req.validatedBody
```

**AI Route** (e.g. `POST /ask-berry`):

```
Request → generalLimiter → aiLimiter → validateBody(askBerrySchema) → Handler → chatWithAssistant() → OpenAI API → res.render()
          (200/15min)       (20/15min)   Joi + stripUnknown                       350 token cap          gpt-3.5-turbo
```

**API Ninja Route** (e.g. `GET /api/ninjas/nutrition?query=apple`):

```
Request → generalLimiter → postLimiter → validateQuery(schema) → Handler → getNutritionInfo() → api-ninjas.com → res.json()
          (200/15min)       (50/15min)    Joi + stripUnknown                 axios GET              X-Api-Key header
```

---

## Page Routes (index.js)

All page routes render EJS templates. Validated data lands in `req.validatedBody` or `req.validatedParams`.

| Method | Route | Middleware Chain | Handler | Template |
|--------|-------|------------------|---------|----------|
| **GET** | `/` | generalLimiter | render sign-in | signin.ejs |
| **POST** | `/home` | generalLimiter → postLimiter → validateBody(signInSchema) | store name_data, render home | index.ejs |
| **GET** | `/home` | generalLimiter | render home (name_data from var) | index.ejs |
| **GET** | `/ask-berry` | generalLimiter | render empty chat page | ask-berry.ejs |
| **POST** | `/ask-berry` | generalLimiter → aiLimiter → validateBody(askBerrySchema) | chatWithAssistant() → render response | ask-berry.ejs |
| **GET** | `/calendar` | generalLimiter | SELECT * all 3 tables → render | calendar.ejs |
| **POST** | `/calendar` | generalLimiter → postLimiter → validateBody(nutriCardSchema) | INSERT nutri-card → SELECT * all 3 → render | calendar.ejs |
| **POST** | `/calendar2` | generalLimiter → postLimiter → validateBody(fitCardSchema) | INSERT fit-card → SELECT * all 3 → render | calendar.ejs |
| **POST** | `/calendar3` | generalLimiter → postLimiter → validateBody(recoveryCardSchema) | INSERT recovery-card → SELECT * all 3 → render | calendar.ejs |
| **GET** | `/create/nutricard` | generalLimiter | render form | create-nutricard.ejs |
| **GET** | `/create/fitcard` | generalLimiter | render form | create-fitcard.ejs |
| **GET** | `/create/recoverycard` | generalLimiter | render form | create-recoverycard.ejs |
| **GET** | `/details/:type/:id` | generalLimiter → validateParams(cardType, cardId) | SELECT from :type WHERE id=:id → render | card-details.ejs |
| **POST** | `/delete/:type/:id` | generalLimiter → postLimiter → validateParams(cardType, cardId) | DELETE from :type WHERE id=:id → redirect /calendar | -- |
| **GET** | `/contact` | generalLimiter | render about page | about-us.ejs |
| **GET** | `/health` | generalLimiter | JSON `{ status: 'ok' }` | -- |

---

## API Routes: /api/ai/* (aiRoutes.js)

All routes go through `generalLimiter → aiLimiter (20/15min) → validateBody()`.

Response format: `{ status, response|plan|advice, timestamp }`

| Method | Route | Schema | Service Function | Tokens |
|--------|-------|--------|------------------|--------|
| **POST** | `/api/ai/chat` | apiChatSchema | `chatWithAssistant(message, userGoals, context)` | 350 |
| **POST** | `/api/ai/workout-plan` | apiWorkoutPlanSchema | `generateWorkoutPlan({ goal, fitnessLevel, daysPerWeek, duration, equipment, preferences })` | 550 |
| **POST** | `/api/ai/meal-plan` | apiMealPlanSchema | `generateMealPlan({ goal, dietaryRestrictions, calories, mealsPerDay, preferences })` | 550 |
| **POST** | `/api/ai/wellness-advice` | apiWellnessSchema | `getWellnessAdvice(topic, userGoals, currentHabits)` | 350 |

### Request Body Shapes

```jsonc
// POST /api/ai/chat
{
  "message": "string (required, max 2000)",
  "userGoals": "string (optional, max 200)",
  "context": "string (optional, max 2000)"
}

// POST /api/ai/workout-plan
{
  "goal": "string (required, max 200)",
  "fitnessLevel": "string (opt, max 50, default 'beginner')",
  "daysPerWeek": 3,       // int 1-7, default 3
  "duration": 30,          // int 5-180 min, default 30
  "equipment": "string (opt, max 100, default 'none')",
  "preferences": {}        // object (opt)
}

// POST /api/ai/meal-plan
{
  "goal": "string (required, max 200)",
  "dietaryRestrictions": ["string[]"],  // opt, each max 100
  "calories": 2000,        // int 500-10000, default 2000
  "mealsPerDay": 3,        // int 1-6, default 3
  "preferences": {}
}

// POST /api/ai/wellness-advice
{
  "topic": "string (opt, max 200)",
  "userGoals": "string (opt, max 200)",
  "currentHabits": "string (opt, max 2000)"
}
```

---

## API Routes: /api/ninjas/* (apiNinjaRoutes.js)

All routes go through `generalLimiter → postLimiter (50/15min) → validateQuery()`.

Response format: `{ status, data, timestamp }`

| Method | Route | Query Params | Service Function | External Endpoint |
|--------|-------|-------------|------------------|-------------------|
| **GET** | `/api/ninjas/nutrition` | **query** (max 300) | `getNutritionInfo(query)` | /v1/nutrition |
| **GET** | `/api/ninjas/nutrition-item` | **item** (max 200), _quantity_ (max 50) | `getNutritionItem(item, qty)` | /v1/nutritionitem |
| **GET** | `/api/ninjas/recipes` | **query** (max 300) | `searchRecipes({ query })` | /v1/recipe |
| **GET** | `/api/ninjas/exercises` | _name_, _type_, _muscle_, _difficulty_, _equipment_ (at least 1 required) | `getExercises(params)` | /v1/exercises |
| **GET** | `/api/ninjas/exercises/muscle/:muscle` | _limit_ (1-100), _offset_ (int) | `getAllExercisesForMuscle(muscle, limit, offset)` | /v1/allexercises |

**Bold** = required, _italic_ = optional.

---

## Rate Limiting

IP-based, configurable via env. On limit hit: HTTP `429` + `Retry-After` header + JSON body.

| Limiter | Max Requests | Window | Env Override | Applied To |
|---------|-------------|--------|-------------|------------|
| `generalLimiter` | 200 | 15 min | `RATE_LIMIT_MAX_GENERAL` | All routes (global) |
| `postLimiter` | 50 | 15 min | `RATE_LIMIT_MAX_POST` | POST forms, API Ninjas routes |
| `aiLimiter` | 20 | 15 min | `RATE_LIMIT_MAX_AI` | /ask-berry, /api/ai/* |

Window override: `RATE_LIMIT_WINDOW_MS` (default `900000` = 15 min).

429 response shape (`rateLimit.js` → `handleLimitReached()`):

```json
{
  "error": "Too many requests",
  "message": "Please slow down and try again later.",
  "retryAfterSeconds": 900
}
```

Headers: `Retry-After: 900`, `RateLimit-*` (standardHeaders: true).

---

## Validation Middleware

`validate.js` exports 3 functions. All use `stripUnknown: true` (unknown fields silently removed) and `abortEarly: false` (all errors collected).

| Function | Validates | Output Location | On Failure |
|----------|-----------|-----------------|------------|
| `validateBody(schema, opts)` | `req.body` | `req.validatedBody` | `opts.htmlResponse` ? 400 HTML page : 400 JSON `{ error, message }` |
| `validateParams(typeSchema, idSchema)` | `req.params.type`, `req.params.id` | `req.validatedParams` `{ type, id }` | 400 text message |
| `validateQuery(schema)` | `req.query` | `req.validatedQuery` | 400 JSON `{ error, message }` |

> **Note:** `htmlResponse: true` is used on page POST routes (forms) so the user sees an HTML error page with a back link instead of raw JSON. API routes omit this flag and return JSON.

---

## Joi Schemas

Defined in `config/schemas.js`. **Bold** = required, _italic_ = optional.

### signInSchema (POST /home)

| Field | Type | Constraints |
|-------|------|-------------|
| **firstName** | string | trim, max 100 |
| **lastName** | string | trim, max 100 |

### nutriCardSchema (POST /calendar)

| Field | Type | Constraints |
|-------|------|-------------|
| **title** | string | trim, max 200 |
| **day** | enum | sunday\|monday\|tuesday\|wednesday\|thursday\|friday\|saturday |
| **time** | string | trim, max 10 |
| _carbs_ | int | min 0, allow '' \| null |
| _protein_ | int | min 0, allow '' \| null |
| _fat_ | int | min 0, allow '' \| null |
| _base_ | string | trim, max 2000, allow '' |
| _main_ | string | trim, max 2000, allow '' |
| _side_ | string | trim, max 2000, allow '' |
| _extras_ | string | trim, max 2000, allow '' |
| _notes_ | string | trim, max 2000, allow '' |

### fitCardSchema (POST /calendar2)

| Field | Type | Constraints |
|-------|------|-------------|
| **title** | string | trim, max 200 |
| **day** | enum | sunday-saturday |
| **time** | string | trim, max 10 |
| **exerciseType** | string | trim, max 50 |
| **duration** | int | min 1, max 600 |
| **intensity** | string | trim, max 20 |
| _muscleGroups_ | string | trim, max 2000, allow '' |
| _equipment_ | string | trim, max 2000, allow '' |
| _notes_ | string | trim, max 2000, allow '' |

### recoveryCardSchema (POST /calendar3)

| Field | Type | Constraints |
|-------|------|-------------|
| **title** | string | trim, max 200 |
| **day** | enum | sunday-saturday |
| **time** | string | trim, max 10 |
| **exerciseType** | string | trim, max 50 |
| **duration** | int | min 1, max 600 |
| **intensity** | string | trim, max 20 |
| _bodyPart_ | string | trim, max 200, allow '' |
| _precautions_ | string | trim, max 2000, allow '' |
| _equipment_ | string | trim, max 2000, allow '' |
| _instructions_ | string | trim, max 2000, allow '' |

### askBerrySchema (POST /ask-berry)

| Field | Type | Constraints |
|-------|------|-------------|
| **prompt** | string | trim, max 2000 |

### cardTypeSchema / cardIdSchema (params for /details/:type/:id, /delete/:type/:id)

| Param | Type | Constraints |
|-------|------|-------------|
| **:type** | enum | `'nutri-card'` \| `'fit-card'` \| `'recovery-card'` |
| **:id** | string | numeric digits (`/^\d+$/`) OR UUID |

---

## Database Schema (Supabase PostgreSQL)

Client: `db/supabase.js`. Uses `SUPABASE_ANON_KEY` (falls back to `SUPABASE_API_KEY`). Creates a Proxy stub that throws on any call if env is missing.

### `nutri-card`

| Column | Type | Notes |
|--------|------|-------|
| id | PK | auto |
| title | string(200) | NOT NULL |
| day | enum(sun-sat) | NOT NULL |
| time | string | NOT NULL |
| carbs | int | NULL |
| protein | int | NULL |
| fat | int | NULL |
| base | text(2000) | |
| main | text(2000) | |
| side | text(2000) | |
| extras | text(2000) | |
| notes | text(2000) | |

### `fit-card`

| Column | Type | Notes |
|--------|------|-------|
| id | PK | auto |
| title | string(200) | NOT NULL |
| day | enum(sun-sat) | NOT NULL |
| time | string | NOT NULL |
| exerciseType | string(50) | NOT NULL |
| duration | int(1-600) | NOT NULL |
| intensity | string(20) | NOT NULL |
| muscleGroups | text(2000) | |
| equipment | text(2000) | |
| notes | text(2000) | |

### `recovery-card`

| Column | Type | Notes |
|--------|------|-------|
| id | PK | auto |
| title | string(200) | NOT NULL |
| day | enum(sun-sat) | NOT NULL |
| time | string | NOT NULL |
| exerciseType | string(50) | NOT NULL |
| duration | int(1-600) | NOT NULL |
| intensity | string(20) | NOT NULL |
| bodyPart | string(200) | |
| precautions | text(2000) | |
| equipment | text(2000) | |
| instructions | text(2000) | |

---

## Database Operations by Route

| Route | Table | Operation | Notes |
|-------|-------|-----------|-------|
| `GET /home` | nutri-card | SELECT * | Fetches but only logs (data not used in template) |
| `POST /calendar` | nutri-card | INSERT + SELECT * (all 3 tables) | Coerces `''` to `null` for carbs/protein/fat |
| `POST /calendar2` | fit-card | INSERT + SELECT * (all 3 tables) | |
| `POST /calendar3` | recovery-card | INSERT + SELECT * (all 3 tables) | |
| `GET /calendar` | all 3 | SELECT * + count (6 queries total) | Passes nutriCards, fitCards, recoveryCards + counts to template |
| `GET /details/:type/:id` | :type | SELECT * WHERE id=:id `.single()` | Dynamic table from validated param |
| `POST /delete/:type/:id` | :type | DELETE WHERE id=:id | Redirects to /calendar on success |

> **Note:** Calendar POST routes (`/calendar`, `/calendar2`, `/calendar3`) each run 7 Supabase queries: 1 INSERT + 3 SELECT * + 3 count queries.

---

## AI Service -- Berry (aiService.js)

| Function | Parameters | Token Limit | Fallback |
|----------|-----------|-------------|----------|
| `chatWithAssistant()` | message, userGoals?, context? | 350 (`OPENAI_MAX_TOKENS_CHAT`) | `getFallbackResponse()` -- generic fitness/nutrition tips |
| `generateWorkoutPlan()` | { goal, fitnessLevel, daysPerWeek, duration, equipment, preferences } | 550 (`OPENAI_MAX_TOKENS_PLANS`) | `getFallbackWorkoutPlan()` -- hardcoded basic plan |
| `generateMealPlan()` | { goal, dietaryRestrictions, calories, mealsPerDay, preferences } | 550 (`OPENAI_MAX_TOKENS_PLANS`) | `getFallbackMealPlan()` -- hardcoded basic meals |
| `getWellnessAdvice()` | topic?, userGoals?, currentHabits? | 350 (`OPENAI_MAX_TOKENS_CHAT`) | `getFallbackWellnessAdvice()` -- generic wellness tips |

> **Berry mention detection:** `buildUserMessage()` checks if the user message contains `'berry'` (case-insensitive) and prepends `[User is addressing Berry by name]` to the prompt.

OpenAI call config (all functions use the same pattern):

```js
{
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: MAX_TOKENS_CHAT, // or MAX_TOKENS_PLANS
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: builtMessage }
  ]
}
```

---

## API Ninja Service (apiNinjaService.js)

Base URL: `https://api.api-ninjas.com/v1`

Auth: `X-Api-Key` header.

All functions return `{ success: boolean, data | error }`.

| Function | External Endpoint | API Key Used | Params |
|----------|-------------------|-------------|--------|
| `getNutritionInfo(query)` | GET /nutrition | NUTRITION_API_KEY | query: string |
| `getNutritionItem(item, qty)` | GET /nutritionitem | NUTRITION_API_KEY | query, quantity (default `'100g'`) |
| `searchRecipes({ query })` | GET /recipe | RECIPE_API_KEY | query: string |
| `getExercises(params)` | GET /exercises | EXERCISE_API_KEY | name?, type?, muscle?, difficulty?, equipment? |
| `getAllExercisesForMuscle(muscle, limit, offset)` | GET /allexercises | EXERCISE_API_KEY | muscle, limit (max 100), offset |

---

## Error Flows

### Rate Limit Hit
- **Status:** `429` Too Many Requests
- `Retry-After` header (seconds)
- JSON: `{ error, message, retryAfterSeconds }`
- Handled in: `rateLimit.js` → `handleLimitReached()`

### Validation Failure
- **Status:** `400` Bad Request
- Page routes: HTML error page with back link (`htmlResponse: true`)
- API routes: JSON `{ error: 'Validation failed', message }`
- All Joi errors collected (`abortEarly: false`)

### OpenAI API Failure
- Invalid key: returns fallback text response (app still works)
- Other errors: throws, caught by route handler
- `POST /ask-berry`: renders `"Berry is taking a break"`
- API routes: `500` `{ error, status: 'error', message }`

### Supabase Error
- Env not set: Proxy stub throws on any method call
- Query error: `console.error` + generic user message
- `/details/:type/:id`: `"Error finding that card."`
- `/delete/:type/:id`: `"Error deleting card. Please try again."`

### API Ninjas Failure
- Key not set: throws `"API key is not configured"`
- Request error: returns `{ success: false, error }`
- Route returns `500` JSON
- No fallback responses (unlike AI service)

### 404 Catch-All
- **Status:** `404` → redirect to `/`
- Any unmatched route goes to sign-in page
- Registered after all routes + static middleware

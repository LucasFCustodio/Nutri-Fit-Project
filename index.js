import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chatWithAssistant } from './backend/services/aiService.js';
import supabase from './backend/db/supabase.js';
import { generalLimiter, postLimiter, aiLimiter } from './backend/middleware/rateLimit.js';
import { validateBody, validateParams } from './backend/middleware/validate.js';
import {
    signInSchema,
    nutriCardSchema,
    fitCardSchema,
    recoveryCardSchema,
    askBerrySchema,
    cardTypeSchema,
    cardIdSchema
} from './backend/config/schemas.js';
import aiRoutes from './backend/routes/aiRoutes.js';
import apiNinjaRoutes from './backend/routes/apiNinjaRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env (no keys in code - OWASP)
dotenv.config({ path: join(__dirname, 'backend', '.env') });

const app = express();
const port = process.env.PORT || 3000;

// View engine (required for res.render)
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Rate limiting: apply general (IP-based) to all routes first
app.use(generalLimiter);

// Middleware (form + JSON for API routes)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- Page routes (must be before static so GET / is handled here, not by static) ---
// Health check (confirm this app is running: GET http://localhost:PORT/health)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'NutriFit' });
});

// Server SIGN-IN get request (root path)
app.get('/', (req, res) => {
    res.render('signin.ejs');
});

// Server HOME PAGE post request (validated; no unexpected fields)
var name_data;
app.post('/home', postLimiter, validateBody(signInSchema, { htmlResponse: true }), (req, res) => {
    const v = req.validatedBody;
    name_data = { firstName: v.firstName, lastName: v.lastName };
    res.render('index.ejs', {
        data: name_data,
        pageCss: '/styles/index.css'
    });
});


//This app.get request is able to fetch data from the supabase table 'nutri-card'. I should be able to pass that data to the EJS template, and use a foreach loop to display all the nutri-cards stored in the
//database in the weekly calendar page.
app.get('/home', async (req, res) => {
     const { data, error } = await supabase.from('nutri-card').select('*');
     if (error) {
         console.error('Error fetching data:', error);
     } else {
         console.log(data); // Pass data to EJS template
     }
    res.render('index.ejs', { 
        pageCss: '/styles/index.css',
        data: name_data
    });
});


// Post Request for calendar page when data comes in from NUTRI CARD form (validated)
var nutriData;
app.post('/calendar', postLimiter, validateBody(nutriCardSchema, { htmlResponse: true }), async (req, res) => {
    nutriData = req.validatedBody;
    // Coerce optional numbers (Joi may leave '' from form)
    if (nutriData.carbs === '' || nutriData.carbs == null) nutriData.carbs = null;
    if (nutriData.protein === '' || nutriData.protein == null) nutriData.protein = null;
    if (nutriData.fat === '' || nutriData.fat == null) nutriData.fat = null;
    const { data, error } = await supabase
        .from('nutri-card')
        .insert([ nutriData ]);

    console.log("Here's the data being inserted:", data);

    if (error) {
        console.error('Error inserting data:', error);
    } else {
        console.log('Data inserted successfully:', data);
    }

    //Fetch all nutri cards from supabase so I can send it to calendar.ejs
    const nutriCards = await supabase
        .from('nutri-card')
        .select('*');

    //Send the amount of nutri cards to calendar.ejs
    const nutriCount = await supabase
        .from('nutri-card')
        .select('*', { count: 'exact' });

    //Fetch all fit cards from supabase so I can send it to calendar.ejs
    const fitCards = await supabase
        .from('fit-card')
        .select('*');

    //Send the amount of fit cards to calendar.ejs
    const fitCount = await supabase
        .from('fit-card')
        .select('*', { count: 'exact' });
    
    //Fetch all recovery cards from supabase so I can send it to calendar.ejs
    const recoveryCards = await supabase
        .from('recovery-card')
        .select('*');

    //Send the amount of recovery cards to calendar.ejs
    const recoveryCount = await supabase
        .from('recovery-card')
        .select('*', { count: 'exact' });

    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        recoveryCards: recoveryCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        recoveryCount: recoveryCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
});

app.post('/calendar2', postLimiter, validateBody(fitCardSchema, { htmlResponse: true }), async (req, res) => {
    nutriData = req.validatedBody;
    const { data, error } = await supabase
        .from('fit-card')
        .insert([ nutriData ]);

    console.log(data);

    if (error) {
        console.error('Error inserting data:', error);
    } else {
        console.log('Data inserted successfully:', data);
    }

    //Fetch all nutri cards from supabase so I can send it to calendar.ejs
    const nutriCards = await supabase
        .from('nutri-card')
        .select('*');

    //Send the amount of nutri cards to calendar.ejs
    const nutriCount = await supabase
        .from('nutri-card')
        .select('*', { count: 'exact' });

    //Fetch all fit cards from supabase so I can send it to calendar.ejs
    const fitCards = await supabase
        .from('fit-card')
        .select('*');

    //Send the amount of fit cards to calendar.ejs
    const fitCount = await supabase
        .from('fit-card')
        .select('*', { count: 'exact' });

    //Fetch all recovery cards from supabase so I can send it to calendar.ejs
    const recoveryCards = await supabase
        .from('recovery-card')
        .select('*');

    //Send the amount of recovery cards to calendar.ejs
    const recoveryCount = await supabase
        .from('recovery-card')
        .select('*', { count: 'exact' });
        
    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        recoveryCards: recoveryCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        recoveryCount: recoveryCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
});

app.post('/calendar3', postLimiter, validateBody(recoveryCardSchema, { htmlResponse: true }), async (req, res) => {
    nutriData = req.validatedBody;
    const { data, error } = await supabase
        .from('recovery-card')
        .insert([ nutriData ]);

    console.log(data);

    if (error) {
        console.error('Error inserting data:', error);
    } else {
        console.log('Data inserted successfully:', data);
    }

    //Fetch all nutri cards from supabase so I can send it to calendar.ejs
    const nutriCards = await supabase
        .from('nutri-card')
        .select('*');

    //Send the amount of nutri cards to calendar.ejs
    const nutriCount = await supabase
        .from('nutri-card')
        .select('*', { count: 'exact' });

    //Fetch all fit cards from supabase so I can send it to calendar.ejs
    const fitCards = await supabase
        .from('fit-card')
        .select('*');

    //Send the amount of fit cards to calendar.ejs
    const fitCount = await supabase
        .from('fit-card')
        .select('*', { count: 'exact' });

    //Fetch all recovery cards from supabase so I can send it to calendar.ejs
    const recoveryCards = await supabase
        .from('recovery-card')
        .select('*');

    //Send the amount of recovery cards to calendar.ejs
    const recoveryCount = await supabase
        .from('recovery-card')
        .select('*', { count: 'exact' });
        
    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        recoveryCards: recoveryCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        recoveryCount: recoveryCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
});

app.get('/calendar', async (req, res) => {
    //Fetch all nutri cards from supabase so I can send it to calendar.ejs
    const nutriCards = await supabase
        .from('nutri-card')
        .select('*');

    //Send the amount of nutri cards to calendar.ejs
    const nutriCount = await supabase
        .from('nutri-card')
        .select('*', { count: 'exact' });

    //Fetch all fit cards from supabase so I can send it to calendar.ejs
    const fitCards = await supabase
        .from('fit-card')
        .select('*');

    //Send the amount of fit cards to calendar.ejs
    const fitCount = await supabase
        .from('fit-card')
        .select('*', { count: 'exact' });

    //Fetch all recovery cards from supabase so I can send it to calendar.ejs
    const recoveryCards = await supabase
        .from('recovery-card')
        .select('*');

    //Send the amount of recovery cards to calendar.ejs
    const recoveryCount = await supabase
        .from('recovery-card')
        .select('*', { count: 'exact' });

    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        recoveryCards: recoveryCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        recoveryCount: recoveryCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
});

// Server GET request for specific card details (params validated)
app.get('/details/:type/:id', validateParams(cardTypeSchema, cardIdSchema), async (req, res) => {
    const { type: cardType, id: cardId } = req.validatedParams;

    const { data, error } = await supabase
        .from(cardType)
        .select('*')
        .eq('id', cardId)
        .single();

    if (error) {
        console.error("Error fetching details:", error);
        res.send("Error finding that card.");
    } else {
        // Render the new details page and pass the data
        res.render('card-details.ejs', { 
            card: data, 
            type: cardType,
            pageCss: '/styles/card-details.css' // Optional: create this CSS file later
        });
    }
});

// Server POST request to DELETE a card (params validated)
app.post('/delete/:type/:id', postLimiter, validateParams(cardTypeSchema, cardIdSchema), async (req, res) => {
    const { type: cardType, id: cardId } = req.validatedParams;

    const { error } = await supabase
        .from(cardType)       // Select the table (e.g., 'nutri-card')
        .delete()             // The delete command
        .eq('id', cardId);    // specific row where id matches

    if (error) {
        console.error("Error deleting card:", error);
        res.send("Error deleting card. Please try again.");
    } else {
        console.log(`Deleted card ${cardId} from ${cardType}`);
        // Redirect back to the calendar so they see it's gone
        res.redirect('/calendar');
    }
});

//Server MAKE NUTRI CARD get request
app.get('/create/nutricard', (req, res) => {
    res.render('create-nutricard.ejs', { pageCss: '/styles/create-nutricard.css' });
});

//Server MAKE FIT CARD get request
app.get('/create/fitcard', (req, res) => {
    res.render('create-fitcard.ejs', { pageCss: '/styles/create-fitcard.css' });
});

//Server MAKE RECOVERY CARD get request
app.get('/create/recoverycard', (req, res) => {
    res.render('create-recoverycard.ejs', { pageCss: '/styles/create-recoverycard.css' });
});

// Contact Us / About Us – show developers
app.get('/contact', (req, res) => {
    res.render('about-us.ejs', {
        pageCss: '/styles/about-us.css'
    });
});

//Server ASK BERRY get request
app.get('/ask-berry', (req, res) => {
    res.render('ask-berry.ejs', { 
        pageCss: '/styles/ask-berry.css',
        response: null,      // Initialize as null so the page doesn't crash
        userPrompt: null       // Initialize as null
    });
});

// Server ASK BERRY post request (rate-limited, validated)
app.post('/ask-berry', aiLimiter, validateBody(askBerrySchema, { htmlResponse: true }), async (req, res) => {
    try {
        const userPrompt = req.validatedBody.prompt;

        const aiResult = await chatWithAssistant(userPrompt, null, null);

        let botMessage;
        if (typeof aiResult === 'string') {
            botMessage = aiResult;
        } else if (aiResult && aiResult.choices && aiResult.choices.length > 0) {
            botMessage = aiResult.choices[0].message.content;
        } else {
            botMessage = "I didn't receive a valid response.";
        }

        res.render('ask-berry.ejs', {
            pageCss: '/styles/ask-berry.css',
            response: botMessage,
            userPrompt: userPrompt
        });
    } catch (error) {
        console.error('AI Error:', error);
        res.render('ask-berry.ejs', {
            pageCss: '/styles/ask-berry.css',
            response: 'Sorry, Berry is taking a break. Please try again later.',
            userPrompt: req.validatedBody?.prompt ?? ''
        });
    }
});

// Static assets (CSS, JS, images) — after page routes so GET / is handled above
app.use(express.static('public'));

// API routes (rate-limited; validation applied inside each router)
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/ninjas', postLimiter, apiNinjaRoutes);

// 404: send back to sign-in (so unknown paths don't show a generic error)
app.use((req, res) => {
    res.status(404).redirect('/');
});

app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
    console.log('  → Sign-in: http://localhost:' + port + '/');
    console.log('  → Health:  http://localhost:' + port + '/health');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('Port ' + port + ' is already in use. Stop the other process or set PORT in backend/.env to a different number (e.g. 3000).');
        process.exit(1);
    }
    throw err;
});
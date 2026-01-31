import express from 'express';
import bodyParser from 'body-parser';
import supabase from './public/js/supabaseClient.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chatWithAssistant } from './backend/services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, 'backend', '.env') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Use environment variables for security
});

const app = express();
const port = process.env.PORT || 3000;

// View engine (required for res.render)
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

//Public folder
app.use(express.static("public"));

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));

//server SIGN-IN get request
app.get('/', (req, res) => {
    res.render('signin.ejs');
});

//Server HOME PAGE post request
var name_data;
app.post('/home', (req, res) => {
    name_data = {
        firstName: req.body.firstName,
        lastName: req.body.lastName
    };
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


//Post Request for calendar page when data comes in from NUTRI CARD form
var nutriData;
app.post('/calendar', async (req, res) => {
    nutriData = req.body;
    //Insert nutriData content into the nutri-card table in supabase
    const { data, error } = await supabase
        .from('nutri-card')
        .insert([ nutriData ]);;

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

    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
});

app.post('/calendar2', async (req, res) => {
    nutriData = req.body;
    //Insert nutriData content into the fit table in supabase
    const { data, error } = await supabase
        .from('fit-card')
        .insert([ nutriData ]);;

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

    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });
})

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

    res.render('calendar.ejs', {
        nutriCards: nutriCards.data,
        fitCards: fitCards.data,
        nutriCount: nutriCount.count,
        fitCount: fitCount.count,
        pageCss: 'styles/calendar.css',
        pageJQuery: 'js/calendar.js'
    });

    console.log("Here are the nutri cards:", nutriCards.data);
});

//Server MAKE NUTRI CARD get request
app.get('/create/nutricard', (req, res) => {
    res.render('create-nutricard.ejs', { pageCss: '/styles/create-nutricard.css' });
});

//Server MAKE FIT CARD get request
app.get('/create/fitcard', (req, res) => {
    res.render('create-fitcard.ejs', { pageCss: '/styles/create-fitcard.css' });
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
        userPrompt: ''       // Initialize as empty string
    });
});

//Server ASK BERRY post request (Handle the AI Logic)
app.post('/ask-berry', async (req, res) => {
    try {
        const userPrompt = req.body.prompt;
        
        // 1. Call your AI service
        // We pass 'null' for goals/context for now since the simple form doesn't have them
        const aiResult = await chatWithAssistant(userPrompt, null, null);
        
        // 2. Extract the text message
        // OpenAI returns a complex object, we need to dig into .choices[0].message.content
        // We add a safety check just in case the service returns a plain string
        let botMessage;
        if (typeof aiResult === 'string') {
            botMessage = aiResult;
        } else if (aiResult && aiResult.choices && aiResult.choices.length > 0) {
            botMessage = aiResult.choices[0].message.content;
        } else {
            botMessage = "I didn't receive a valid response.";
        }

        // 3. Render the page again with the response
        res.render('ask-berry.ejs', { 
            pageCss: '/styles/ask-berry.css',
            response: botMessage, 
            userPrompt: userPrompt 
        });

        } catch (error) {
            console.error("AI Error:", error);
            res.render('ask-berry.ejs', { 
                pageCss: '/styles/ask-berry.css',
                response: "Sorry, Berry is taking a break. Please try again later.", 
                userPrompt: req.body.prompt 
            });
        }
    });

app.listen(port, () => {
    console.log("Server running on port " + port);
});
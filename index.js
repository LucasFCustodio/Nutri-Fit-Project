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

app.listen(port, () => {
    console.log("Server running on port " + port);
});
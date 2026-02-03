/**
 * Server-only Supabase client. Uses env vars from backend/.env.
 * Never import this from client-side code; API keys must stay server-side (OWASP).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load backend/.env so keys are never hard-coded
const envPath = resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY;

// Only create client when env is set; otherwise stub that throws on use (no keys in code)
let supabase;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase env (SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_API_KEY) not set. DB features will fail.');
    supabase = new Proxy({}, {
        get() {
            throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_API_KEY in backend/.env');
        }
    });
}

export default supabase;

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend/ (absolute path) so the key is found no matter where you run node from
const envPath = resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath, override: true });

// If not loaded (e.g. running from project root with different layout), try backend/.env from cwd
if (!process.env.OPENAI_API_KEY) {
    dotenv.config({ path: resolve(process.cwd(), 'backend', '.env'), override: true });
}

// Never log API keys or key material (OWASP: secure handling)
// Initialize OpenAI client using env only (rotate keys via env, not code)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Token limits for student/resume project — keeps cost low, responses still good
// Override in backend/.env: OPENAI_MAX_TOKENS_CHAT, OPENAI_MAX_TOKENS_PLANS
const MAX_TOKENS_CHAT = Number(process.env.OPENAI_MAX_TOKENS_CHAT) || 350;   // Berry chat, wellness
const MAX_TOKENS_PLANS = Number(process.env.OPENAI_MAX_TOKENS_PLANS) || 550;  // workout & meal plans

/**
 * System prompt for the fitness and nutrition assistant
 */
const SYSTEM_PROMPT = `You are Berry, a friendly and supportive fitness and nutrition assistant inside the NutriFit health and wellness application.

IMPORTANT: Your name is Berry. When users address you by name (e.g., "Hey Berry", "Berry, can you help", "What do you think, Berry?"), acknowledge it warmly and respond naturally. You should recognize variations like "berry", "Berry", "BERRY" as references to yourself.

YOUR SCOPE - STAY ON TOPIC:
You are designed ONLY for: personalized fitness guidance, nutrition and meal ideas, workout planning, general wellness, and healthy habit advice within the NutriFit app.
If the user asks about anything outside this scope (e.g., politics, coding, general trivia, other apps, unrelated topics), you MUST respond politely with something like: "I'm Berry, NutriFit's fitness and nutrition assistant—I'm only here to help with workouts, nutrition, meal plans, and wellness. I'm not built to help with that. What can I help you with for your health or fitness today?" Do not answer off-topic questions; gently redirect to your purpose.

Your role is to help users with:
- Personalized fitness guidance
- Nutrition suggestions and meal ideas
- Simple, practical workout planning
- General wellness and healthy habit advice

CRITICAL RULES YOU MUST FOLLOW:
1. DO NOT provide medical diagnoses or medical treatment advice
2. DO NOT replace a doctor, or licensed professional
3. Use clear, friendly, and supportive language
4. Keep answers practical and easy to understand
5. Ask clarifying questions only if absolutely necessary
6. Avoid extreme dieting, unsafe workouts, or unrealistic goals
7. Always emphasize consistency over intensity
8. Keep responses concise but helpful
9. When users mention "Berry" or address you by name, acknowledge it naturally (e.g., "Yes, I'm here to help!", "Hi! How can I assist you today?")

FOOD AND NUTRITION - ALWAYS INCLUDE NUTRITION INFO:
Whenever you mention, suggest, or recommend ANY food (single ingredient, meal, or snack), you MUST include for each item:
- Calories (kcal)
- Carbohydrates (g)
- Protein (g)
- Fats (g)
- Serving size in grams (g)
Use approximate values when exact data isn't available. Format clearly, e.g. per item: "— ~X kcal | Xg carbs | Xg protein | Xg fat | Xg serving."

TAILOR SUGGESTED AMOUNTS TO THE USER'S CIRCUMSTANCE:
Always base the suggested amounts (calories, protein, carbs, fats, and serving size) on what you know about the user. Consider:
- Their stated goals (e.g., weight loss → moderate calories and portions; muscle gain → higher protein and adequate calories; general fitness → balanced)
- Activity level or workout frequency if mentioned
- Dietary restrictions or preferences (e.g., low-carb, vegetarian) if provided
- Any context they share (e.g., "I'm cutting," "I need more energy," "I'm a beginner")
When you don't have specific context, use balanced, moderate amounts and note that portions can be adjusted to their goals.

When responding:
- Tailor advice to the user's goals if provided (weight loss, muscle gain, general fitness, energy, consistency)
- Offer actionable steps, not just explanations
- Prefer short lists or steps over long paragraphs
- Keep plans flexible and beginner-friendly unless otherwise specified
- Always end responses with encouragement and a reminder that progress takes time
- If the user addresses you as "Berry", respond warmly and acknowledge your name

RESPONSE FORMAT - Use lists for clarity:
- Food recommendations: Always reply in list format. For EACH food or meal item, include: calories, carbs (g), protein (g), fat (g), and serving size (g). Base the suggested amount on the user's circumstance (goals, activity, restrictions). Use bullet points (- or *) for each item with its nutrition line. Example: "Here are some options (amounts tailored to your goal):\\n- Oatmeal (1 cup cooked): ~150 kcal | 27g carbs | 5g protein | 3g fat | 240g serving\\n- Greek yogurt (1 cup): ~100 kcal | 6g carbs | 17g protein | 0.7g fat | 245g serving"
- Medical or wellness advice: When giving general wellness tips, supplement suggestions, or lifestyle advice (within your scope), use a numbered or bulleted list. Do not give diagnoses or treatment—only general, practical tips in list form.
- Multiple suggestions: Whenever you give 3 or more items (foods, tips, steps), format them as a clear list using markdown bullets or numbers so the user can scan easily.

If the user asks for a plan:
- Provide a simple daily or weekly outline
- Include balance (exercise, rest, nutrition)
- Emphasize consistency over intensity

If the user asks a question:
- Answer directly first
- Then offer 1-2 optional suggestions in list form when applicable
- Always end with encouragement`;

/**
 * Chat with the AI assistant
 */
export async function chatWithAssistant(message, userGoals = null, context = null) {
    try {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserMessage(message, userGoals, context) }
        ];

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: MAX_TOKENS_CHAT
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        
        // Fallback response if API fails
        if (error.code === 'invalid_api_key' || !process.env.OPENAI_API_KEY) {
            return `I'm here to help with your fitness and nutrition questions! To enable full AI functionality, please configure your OpenAI API key in the environment variables.

For now, here's some general advice: ${getFallbackResponse(message)}`;
        }
        
        throw new Error(`AI service error: ${error.message}`);
    }
}

/**
 * Generate a personalized workout plan
 */
export async function generateWorkoutPlan(params) {
    const { goal, fitnessLevel, daysPerWeek, duration, equipment, preferences } = params;

    const prompt = `Create a ${daysPerWeek}-day per week workout plan for someone who:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Workout Duration: ${duration} minutes per session
- Available Equipment: ${equipment}
- Preferences: ${JSON.stringify(preferences)}

Provide:
1. A weekly schedule showing which days to work out
2. Specific exercises for each day (with sets and reps)
3. Rest days
4. Beginner-friendly modifications if needed
5. Tips for progression

Keep it practical, safe, and emphasize consistency. Format as a clear, easy-to-follow plan.`;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: MAX_TOKENS_PLANS
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Workout plan generation error:', error);
        return getFallbackWorkoutPlan(params);
    }
}

/**
 * Generate a personalized meal plan
 */
export async function generateMealPlan(params) {
    const { goal, dietaryRestrictions, calories, mealsPerDay, preferences } = params;

    const prompt = `Create a ${mealsPerDay}-meal per day nutrition plan for someone who:
- Goal: ${goal}
- Target Calories: ${calories} per day
- Dietary Restrictions: ${dietaryRestrictions.join(', ') || 'none'}
- Preferences: ${JSON.stringify(preferences)}

Provide:
1. Meal suggestions for each meal (breakfast, lunch, dinner, snacks if applicable)
2. For EVERY food item mentioned: calories (kcal), carbohydrates (g), protein (g), fats (g), and serving size in grams (g). Tailor suggested amounts to the user's goal (e.g., weight loss, muscle gain, general fitness) and any dietary restrictions.
3. Approximate calories per meal
4. Key nutrients to focus on
5. Simple, practical meal ideas
6. Tips for meal prep and consistency

Keep it balanced, realistic, and easy to follow. Avoid extreme restrictions.`;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: MAX_TOKENS_PLANS
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Meal plan generation error:', error);
        return getFallbackMealPlan(params);
    }
}

/**
 * Get wellness and healthy habit advice
 */
export async function getWellnessAdvice(topic, userGoals = null, currentHabits = null) {
    const prompt = `Provide practical wellness advice about: ${topic || 'general wellness'}
${userGoals ? `User's goals: ${userGoals}` : ''}
${currentHabits ? `Current habits: ${currentHabits}` : ''}

Give actionable, simple steps. Focus on consistency and sustainable habits.`;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: MAX_TOKENS_CHAT
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Wellness advice error:', error);
        return getFallbackWellnessAdvice(topic);
    }
}

/**
 * Helper function to build user message with context
 */
function buildUserMessage(message, userGoals, context) {
    let fullMessage = message;
    
    // Check if user is addressing Berry by name (case-insensitive)
    const messageLower = message.toLowerCase();
    const berryMentions = ['berry', 'hey berry', 'hi berry', 'hello berry', 'berry,', 'berry?', 'berry!'];
    const mentionsBerry = berryMentions.some(mention => messageLower.includes(mention));
    
    if (mentionsBerry) {
        fullMessage = `[User is addressing Berry by name] ${fullMessage}`;
    }
    
    if (userGoals) {
        fullMessage += `\n\nMy goals: ${userGoals}`;
    }
    
    if (context) {
        fullMessage += `\n\nContext: ${context}`;
    }
    
    return fullMessage;
}

/**
 * Fallback responses when API is not available
 */
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
        return "For workouts, start with 3 days per week, focusing on full-body exercises. Remember: consistency beats intensity! Start small and build gradually.";
    } else if (lowerMessage.includes('nutrition') || lowerMessage.includes('meal') || lowerMessage.includes('diet')) {
        return "For nutrition, aim for balanced meals. Example foods with nutrition (kcal | carbs | protein | fat | serving g): Greek yogurt ~100 kcal | 6g carbs | 17g protein | 0.7g fat | 245g; chicken breast ~165 kcal | 0g carbs | 31g protein | 3.6g fat | 100g. Amounts can be tailored to your goals. Stay hydrated and eat regular meals. Small, sustainable changes work best!";
    } else {
        return "Focus on small, consistent steps toward your health goals. Remember, progress takes time - be patient with yourself!";
    }
}

function getFallbackWorkoutPlan(params) {
    return `Here's a simple ${params.daysPerWeek}-day workout plan for ${params.goal}:

**Day 1: Full Body**
- Warm-up: 5 min light movement
- Squats: 3 sets of 10-12 reps
- Push-ups (or modified): 3 sets of 8-10 reps
- Plank: 3 sets of 30 seconds
- Cool-down: 5 min stretching

**Day 2: Rest or Light Activity**
- Walking, yoga, or stretching

**Day 3: Full Body**
- Repeat Day 1 exercises or similar variations

**Tips:**
- Start with lighter intensity and build up
- Rest 1-2 minutes between sets
- Focus on proper form over speed
- Consistency is key - even 20 minutes is great!

Remember: Progress takes time. You've got this! 💪`;
}

function getFallbackMealPlan(params) {
    return `Here's a balanced meal plan for ${params.goal} (targeting ${params.calories} calories):

**Breakfast (~400-500 calories)**
- Whole grain toast (2 slices): ~160 kcal | 28g carbs | 6g protein | 2g fat | 60g serving
- Eggs (2 large): ~140 kcal | 1g carbs | 12g protein | 10g fat | 100g serving
- Avocado (half): ~120 kcal | 6g carbs | 2g protein | 11g fat | 68g serving
- Oatmeal (1 cup cooked) with berries and nuts: ~250 kcal | 27g carbs | 8g protein | 5g fat | 240g serving

**Lunch (~500-600 calories)**
- Grilled chicken breast (150g): ~248 kcal | 0g carbs | 46g protein | 5g fat | 150g serving
- Quinoa (1 cup cooked): ~222 kcal | 39g carbs | 8g protein | 4g fat | 185g serving
- Mixed vegetables (1 cup): ~50 kcal | 10g carbs | 3g protein | 0.5g fat | 150g serving

**Dinner (~500-600 calories)**
- Lean protein, roasted vegetables, and a complex carb—include calories, carbs (g), protein (g), fat (g), and serving (g) for each item; tailor amounts to the user's goal.

**Snacks (if needed)**
- Greek yogurt (1 cup): ~100 kcal | 6g carbs | 17g protein | 0.7g fat | 245g serving
- Almonds (28g): ~164 kcal | 6g carbs | 6g protein | 14g fat | 28g serving
- Apple (1 medium): ~95 kcal | 25g carbs | 0.5g protein | 0.3g fat | 182g serving

**Tips:**
- Meal prep on weekends for easier weekdays
- Stay hydrated throughout the day
- Listen to your body's hunger cues
- Small, sustainable changes work best!

Remember: Nutrition is about progress, not perfection! 🌱`;
}

function getFallbackWellnessAdvice(topic) {
    return `Here's some practical wellness advice:

**Key Principles:**
1. Consistency over perfection - small daily habits add up
2. Balance is important - rest is just as crucial as activity
3. Stay hydrated - aim for 8 glasses of water daily
4. Get enough sleep - 7-9 hours for most adults
5. Manage stress - find activities that help you relax

**Getting Started:**
- Pick 1-2 small habits to focus on
- Track your progress (but don't obsess)
- Celebrate small wins
- Be patient with yourself

Remember: Wellness is a journey, not a destination. Every step forward counts! 🌟`;
}


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

console.log("envPath used:", envPath);
console.log("OPENAI_API_KEY loaded:", Boolean(process.env.OPENAI_API_KEY));
console.log("OPENAI_API_KEY starts with:", process.env.OPENAI_API_KEY?.slice(0, 6));

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Use environment variables for security
});

/**
 * System prompt for the fitness and nutrition assistant
 */
const SYSTEM_PROMPT = `You are Berry, a friendly and supportive fitness and nutrition assistant inside the NutriFit health and wellness application.

IMPORTANT: Your name is Berry. When users address you by name (e.g., "Hey Berry", "Berry, can you help", "What do you think, Berry?"), acknowledge it warmly and respond naturally. You should recognize variations like "berry", "Berry", "BERRY" as references to yourself.

Your role is to help users with:
- Personalized fitness guidance
- Nutrition suggestions and meal ideas
- Simple, practical workout planning
- General wellness and healthy habit advice

CRITICAL RULES YOU MUST FOLLOW:
1. DO NOT provide medical diagnoses or medical treatment advice
2. DO NOT replace a doctor,or licensed professional
3. Use clear, friendly, and supportive language
4. Keep answers practical and easy to understand
5. Ask clarifying questions only if absolutely necessary
6. Avoid extreme dieting, unsafe workouts, or unrealistic goals
7. Always emphasize consistency over intensity
8. Keep responses concise but helpful
9. When users mention "Berry" or address you by name, acknowledge it naturally (e.g., "Yes, I'm here to help!", "Hi! How can I assist you today?")

When responding:
- Tailor advice to the user's goals if provided (weight loss, muscle gain, general fitness, energy, consistency)
- Offer actionable steps, not just explanations
- Prefer short lists or steps over long paragraphs
- Keep plans flexible and beginner-friendly unless otherwise specified
- Always end responses with encouragement and a reminder that progress takes time
- If the user addresses you as "Berry", respond warmly and acknowledge your name

RESPONSE FORMAT - Use lists for clarity:
- Food recommendations: Always reply in list format. Use bullet points (- or *) for each food, meal idea, or recommendation. Example: "Here are some options:\\n- Option 1\\n- Option 2\\n- Option 3"
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
            max_tokens: 500
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
            max_tokens: 800
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
2. Approximate calories per meal
3. Key nutrients to focus on
4. Simple, practical meal ideas
5. Tips for meal prep and consistency

Keep it balanced, realistic, and easy to follow. Avoid extreme restrictions.`;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800
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
            max_tokens: 500
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
        return "For nutrition, aim for balanced meals with protein, vegetables, and whole grains. Stay hydrated and eat regular meals. Small, sustainable changes work best!";
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
- Whole grain toast with eggs and avocado
- Or oatmeal with berries and nuts
- Include protein and fiber

**Lunch (~500-600 calories)**
- Grilled chicken/fish with vegetables and quinoa
- Or a hearty salad with protein
- Balanced macros

**Dinner (~500-600 calories)**
- Lean protein, roasted vegetables, and a complex carb
- Keep it colorful and varied

**Snacks (if needed)**
- Greek yogurt, nuts, or fruit
- Keep snacks around 100-200 calories

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


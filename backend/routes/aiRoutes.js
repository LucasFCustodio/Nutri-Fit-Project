import express from 'express';
import { chatWithAssistant, generateWorkoutPlan, generateMealPlan, getWellnessAdvice } from '../services/aiService.js';
import { validateBody } from '../middleware/validate.js';
import { apiChatSchema, apiWorkoutPlanSchema, apiMealPlanSchema, apiWellnessSchema } from '../config/schemas.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * General chat endpoint (validated: message required, length limits, no unexpected fields)
 */
router.post('/chat', validateBody(apiChatSchema), async (req, res) => {
    try {
        const { message, userGoals, context } = req.validatedBody;
        const response = await chatWithAssistant(message, userGoals || null, context || null);
        res.json({
            status: 'success',
            response: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to process chat request',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/ai/workout-plan
 * Generate a personalized workout plan (validated body)
 */
router.post('/workout-plan', validateBody(apiWorkoutPlanSchema), async (req, res) => {
    try {
        const b = req.validatedBody;
        const plan = await generateWorkoutPlan({
            goal: b.goal,
            fitnessLevel: b.fitnessLevel || 'beginner',
            daysPerWeek: b.daysPerWeek ?? 3,
            duration: b.duration ?? 30,
            equipment: b.equipment || 'none',
            preferences: b.preferences || {}
        });
        res.json({
            status: 'success',
            plan: plan,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Workout plan error:', error);
        res.status(500).json({
            error: 'Failed to generate workout plan',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/ai/meal-plan
 * Generate a personalized meal plan (validated body)
 */
router.post('/meal-plan', validateBody(apiMealPlanSchema), async (req, res) => {
    try {
        const b = req.validatedBody;
        const plan = await generateMealPlan({
            goal: b.goal,
            dietaryRestrictions: b.dietaryRestrictions || [],
            calories: b.calories ?? 2000,
            mealsPerDay: b.mealsPerDay ?? 3,
            preferences: b.preferences || {}
        });
        res.json({
            status: 'success',
            plan: plan,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Meal plan error:', error);
        res.status(500).json({
            error: 'Failed to generate meal plan',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/ai/wellness-advice
 * Get general wellness and healthy habit advice (validated body)
 */
router.post('/wellness-advice', validateBody(apiWellnessSchema), async (req, res) => {
    try {
        const b = req.validatedBody;
        const advice = await getWellnessAdvice(b.topic || null, b.userGoals || null, b.currentHabits || null);
        res.json({
            status: 'success',
            advice: advice,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Wellness advice error:', error);
        res.status(500).json({
            error: 'Failed to get wellness advice',
            status: 'error',
            message: error.message
        });
    }
});

export default router;

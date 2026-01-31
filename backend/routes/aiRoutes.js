import express from 'express';
import { chatWithAssistant, generateWorkoutPlan, generateMealPlan, getWellnessAdvice } from '../services/aiService.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * General chat endpoint for fitness and nutrition questions
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, userGoals, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string',
                status: 'error'
            });
        }

        const response = await chatWithAssistant(message, userGoals, context);
        console.log("Response:", response);
        
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
 * Generate a personalized workout plan
 */
router.post('/workout-plan', async (req, res) => {
    try {
        const { 
            goal, 
            fitnessLevel, 
            daysPerWeek, 
            duration, 
            equipment,
            preferences 
        } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: 'Goal is required',
                status: 'error'
            });
        }

        const plan = await generateWorkoutPlan({
            goal,
            fitnessLevel: fitnessLevel || 'beginner',
            daysPerWeek: daysPerWeek || 3,
            duration: duration || 30,
            equipment: equipment || 'none',
            preferences: preferences || {}
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
 * Generate a personalized meal plan
 */
router.post('/meal-plan', async (req, res) => {
    try {
        const { 
            goal, 
            dietaryRestrictions, 
            calories, 
            mealsPerDay,
            preferences 
        } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: 'Goal is required',
                status: 'error'
            });
        }

        const plan = await generateMealPlan({
            goal,
            dietaryRestrictions: dietaryRestrictions || [],
            calories: calories || 2000,
            mealsPerDay: mealsPerDay || 3,
            preferences: preferences || {}
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
 * Get general wellness and healthy habit advice
 */
router.post('/wellness-advice', async (req, res) => {
    try {
        const { topic, userGoals, currentHabits } = req.body;

        const advice = await getWellnessAdvice(topic, userGoals, currentHabits);

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

import express from 'express';
import {
    getNutritionInfo,
    getNutritionItem,
    searchRecipes,
    getExercises,
    getAllExercisesForMuscle
} from '../services/apiNinjasService.js';

const router = express.Router();

/**
 * GET /api/ninjas/nutrition
 * Get nutrition information from text query
 * Query params: query (required) - Food item or meal description
 */
router.get('/nutrition', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                error: 'Query parameter is required',
                status: 'error'
            });
        }

        const result = await getNutritionInfo(query);

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                status: 'error'
            });
        }

        res.json({
            status: 'success',
            data: result.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Nutrition route error:', error);
        res.status(500).json({
            error: 'Failed to fetch nutrition information',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * GET /api/ninjas/nutrition-item
 * Get nutrition information for a specific item with quantity
 * Query params: 
 *   - item (required) - Food item name
 *   - quantity (optional) - Quantity (e.g., "1 cup", "100g", "2 tbsp"), defaults to "100g"
 */
router.get('/nutrition-item', async (req, res) => {
    try {
        const { item, quantity } = req.query;

        if (!item) {
            return res.status(400).json({
                error: 'Item parameter is required',
                status: 'error'
            });
        }

        const result = await getNutritionItem(item, quantity);

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                status: 'error'
            });
        }

        res.json({
            status: 'success',
            data: result.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Nutrition item route error:', error);
        res.status(500).json({
            error: 'Failed to fetch nutrition item information',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * GET /api/ninjas/recipes
 * Search for recipes
 * Query params:
 *   - query (required) - Recipe name or ingredients
 *   - limit (optional) - Number of results (default: 5, max: 5 for free tier)
 *   - offset (optional) - Offset for pagination (premium)
 */
router.get('/recipes', async (req, res) => {
    try {
        const { query, limit, offset } = req.query;

        if (!query) {
            return res.status(400).json({
                error: 'Query parameter is required',
                status: 'error'
            });
        }

        // Don't pass limit/offset for free tier (premium features only)
        const result = await searchRecipes({
            query
            // limit and offset are premium-only, so we don't pass them
        });

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                status: 'error'
            });
        }

        res.json({
            status: 'success',
            data: result.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Recipes route error:', error);
        res.status(500).json({
            error: 'Failed to fetch recipes',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * GET /api/ninjas/exercises
 * Get exercises based on search criteria
 * Query params (all optional):
 *   - name - Exercise name (partial matching)
 *   - type - Exercise type (cardio, olympic_weightlifting, plyometrics, powerlifting, strength, stretching, strongman)
 *   - muscle - Target muscle group
 *   - difficulty - Difficulty level (beginner, intermediate, expert)
 *   - equipment - Equipment needed (comma-separated)
 */
router.get('/exercises', async (req, res) => {
    try {
        const { name, type, muscle, difficulty, equipment } = req.query;

        // At least one parameter should be provided
        if (!name && !type && !muscle && !difficulty && !equipment) {
            return res.status(400).json({
                error: 'At least one search parameter is required (name, type, muscle, difficulty, or equipment)',
                status: 'error'
            });
        }

        const result = await getExercises({
            name,
            type,
            muscle,
            difficulty,
            equipment
        });

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                status: 'error'
            });
        }

        res.json({
            status: 'success',
            data: result.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Exercises route error:', error);
        res.status(500).json({
            error: 'Failed to fetch exercises',
            status: 'error',
            message: error.message
        });
    }
});

/**
 * GET /api/ninjas/exercises/muscle/:muscle
 * Get all exercises for a specific muscle group
 * Query params:
 *   - limit (optional) - Number of results (default: 10, max: 100)
 *   - offset (optional) - Offset for pagination
 */
router.get('/exercises/muscle/:muscle', async (req, res) => {
    try {
        const { muscle } = req.params;
        const { limit, offset } = req.query;

        const result = await getAllExercisesForMuscle(
            muscle,
            limit ? parseInt(limit) : undefined,
            offset ? parseInt(offset) : undefined
        );

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                status: 'error'
            });
        }

        res.json({
            status: 'success',
            data: result.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('All exercises route error:', error);
        res.status(500).json({
            error: 'Failed to fetch exercises',
            status: 'error',
            message: error.message
        });
    }
});

export default router;

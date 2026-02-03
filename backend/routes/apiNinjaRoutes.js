import express from 'express';
import {
    getNutritionInfo,
    getNutritionItem,
    searchRecipes,
    getExercises,
    getAllExercisesForMuscle
} from '../services/apiNinjaService.js';
import { validateQuery } from '../middleware/validate.js';
import {
    apiNutritionQuerySchema,
    apiNutritionItemQuerySchema,
    apiRecipesQuerySchema,
    apiExercisesQuerySchema,
    apiExercisesMuscleQuerySchema,
    apiMuscleParamSchema
} from '../config/schemas.js';

const router = express.Router();

/**
 * GET /api/ninjas/nutrition
 * Query params: query (required), validated length/type
 */
router.get('/nutrition', validateQuery(apiNutritionQuerySchema), async (req, res) => {
    try {
        const { query } = req.validatedQuery;
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
 * Query params: item (required), quantity (optional), validated
 */
router.get('/nutrition-item', validateQuery(apiNutritionItemQuerySchema), async (req, res) => {
    try {
        const { item, quantity } = req.validatedQuery;
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
 * Query params: query (required), validated
 */
router.get('/recipes', validateQuery(apiRecipesQuerySchema), async (req, res) => {
    try {
        const { query } = req.validatedQuery;
        const result = await searchRecipes({ query });

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
 * Query params: at least one of name, type, muscle, difficulty, equipment; validated
 */
router.get('/exercises', validateQuery(apiExercisesQuerySchema), async (req, res) => {
    try {
        const q = req.validatedQuery;
        if (!q.name && !q.type && !q.muscle && !q.difficulty && !q.equipment) {
            return res.status(400).json({
                error: 'At least one search parameter is required (name, type, muscle, difficulty, or equipment)',
                status: 'error'
            });
        }
        const result = await getExercises(q);

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
 * Params: muscle (required, validated). Query: limit, offset (optional)
 */
router.get('/exercises/muscle/:muscle', validateQuery(apiExercisesMuscleQuerySchema), async (req, res) => {
    try {
        const { error: paramErr, value: muscle } = apiMuscleParamSchema.validate(req.params.muscle);
        if (paramErr) {
            return res.status(400).json({ error: 'Invalid muscle parameter', status: 'error' });
        }
        const q = req.validatedQuery || {};
        const result = await getAllExercisesForMuscle(
            muscle,
            q.limit,
            q.offset
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

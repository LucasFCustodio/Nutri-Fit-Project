import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://api.api-ninjas.com/v1';
const EXERCISE_API_KEY = process.env.EXERCISE_API_KEY;
const NUTRITION_API_KEY = process.env.NUTRITION_API_KEY || process.env.EXERCISE_API_KEY; // Fallback to exercise key if nutrition key not set
const RECIPE_API_KEY = process.env.RECIPE_API_KEY || process.env.EXERCISE_API_KEY; // Fallback to exercise key if recipe key not set

/**
 * Get nutrition information from text
 * @param {string} query - Food item or meal description
 * @returns {Promise<Object>} Nutrition data
 */
export async function getNutritionInfo(query) {
    try {
        if (!NUTRITION_API_KEY) {
            throw new Error('Nutrition API key is not configured');
        }

        const response = await axios.get(`${BASE_URL}/nutrition`, {
            params: {
                query: query
            },
            headers: {
                'X-Api-Key': NUTRITION_API_KEY
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Nutrition API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to fetch nutrition information'
        };
    }
}

/**
 * Get nutrition information for a specific item with quantity
 * @param {string} item - Food item name
 * @param {string} quantity - Quantity (e.g., "1 cup", "100g", "2 tbsp")
 * @returns {Promise<Object>} Nutrition data
 */
export async function getNutritionItem(item, quantity) {
    try {
        if (!NUTRITION_API_KEY) {
            throw new Error('Nutrition API key is not configured');
        }

        const response = await axios.get(`${BASE_URL}/nutritionitem`, {
            params: {
                query: item,
                quantity: quantity || '100g'
            },
            headers: {
                'X-Api-Key': NUTRITION_API_KEY
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Nutrition Item API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to fetch nutrition item information'
        };
    }
}

/**
 * Search for recipes
 * @param {Object} params - Search parameters
 * @param {string} params.query - Recipe name or ingredients (premium)
 * @param {number} params.limit - Number of results (default: 5, max: 5 for free tier)
 * @param {number} params.offset - Offset for pagination (premium)
 * @returns {Promise<Object>} Recipe data
 */
export async function searchRecipes(params) {
    try {
        if (!RECIPE_API_KEY) {
            throw new Error('Recipe API key is not configured');
        }

        const { query } = params;

        if (!query) {
            return {
                success: false,
                error: 'Query parameter is required'
            };
        }

        // Build query params - limit and offset are premium-only features
        // For free tier, don't include these parameters
        const queryParams = { query: query };
        
        const response = await axios.get(`${BASE_URL}/recipe`, {
            params: queryParams,
            headers: {
                'X-Api-Key': RECIPE_API_KEY
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Recipe API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to fetch recipes'
        };
    }
}

/**
 * Get exercises based on search criteria
 * @param {Object} params - Search parameters
 * @param {string} params.name - Exercise name (partial matching)
 * @param {string} params.type - Exercise type (cardio, olympic_weightlifting, plyometrics, powerlifting, strength, stretching, strongman)
 * @param {string} params.muscle - Target muscle group
 * @param {string} params.difficulty - Difficulty level (beginner, intermediate, expert)
 * @param {string} params.equipment - Equipment needed (comma-separated)
 * @returns {Promise<Object>} Exercise data
 */
export async function getExercises(params) {
    try {
        if (!EXERCISE_API_KEY) {
            throw new Error('Exercise API key is not configured');
        }

        const { name, type, muscle, difficulty, equipment } = params;

        const queryParams = {};
        if (name) queryParams.name = name;
        if (type) queryParams.type = type;
        if (muscle) queryParams.muscle = muscle;
        if (difficulty) queryParams.difficulty = difficulty;
        if (equipment) queryParams.equipment = equipment;

        const response = await axios.get(`${BASE_URL}/exercises`, {
            params: queryParams,
            headers: {
                'X-Api-Key': EXERCISE_API_KEY
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Exercise API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to fetch exercises'
        };
    }
}

/**
 * Get all exercises for a specific muscle group
 * @param {string} muscle - Target muscle group (required)
 * @param {number} limit - Number of results (default: 10, max: 100)
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Exercise data
 */
export async function getAllExercisesForMuscle(muscle, limit = 10, offset = 0) {
    try {
        if (!EXERCISE_API_KEY) {
            throw new Error('Exercise API key is not configured');
        }

        if (!muscle) {
            return {
                success: false,
                error: 'Muscle parameter is required'
            };
        }

        const response = await axios.get(`${BASE_URL}/allexercises`, {
            params: {
                muscle: muscle,
                limit: Math.min(limit, 100),
                offset: offset
            },
            headers: {
                'X-Api-Key': EXERCISE_API_KEY
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('All Exercises API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to fetch exercises'
        };
    }
}

/**
 * Input validation schemas (OWASP: validate all user input, reject unexpected fields).
 * Uses Joi with .options({ stripUnknown: true }) to allow only known fields and coerce types.
 */

import Joi from 'joi';

// --- Shared constraints (length limits, safe strings) ---
const MAX_TITLE = 200;
const MAX_TEXT = 2000;
const MAX_PROMPT = 2000;
const MAX_NAME = 100;
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const joiOptions = { stripUnknown: true, abortEarly: false };

/**
 * Sign-in (POST /home): firstName, lastName only.
 */
export const signInSchema = Joi.object({
    firstName: Joi.string().trim().max(MAX_NAME).required(),
    lastName: Joi.string().trim().max(MAX_NAME).required()
}).options(joiOptions);

/**
 * Nutri card (POST /calendar): known fields only, types and lengths enforced.
 */
export const nutriCardSchema = Joi.object({
    title: Joi.string().trim().max(MAX_TITLE).required(),
    day: Joi.string().valid(...DAYS).required(),
    time: Joi.string().trim().max(10).required(),
    carbs: Joi.number().integer().min(0).allow('', null).optional(),
    protein: Joi.number().integer().min(0).allow('', null).optional(),
    fat: Joi.number().integer().min(0).allow('', null).optional(),
    base: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    main: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    side: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    extras: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    notes: Joi.string().trim().max(MAX_TEXT).allow('').optional()
}).options(joiOptions);

/**
 * Fit card (POST /calendar2).
 */
export const fitCardSchema = Joi.object({
    title: Joi.string().trim().max(MAX_TITLE).required(),
    day: Joi.string().valid(...DAYS).required(),
    time: Joi.string().trim().max(10).required(),
    exerciseType: Joi.string().trim().max(50).required(),
    duration: Joi.number().integer().min(1).max(600).required(),
    intensity: Joi.string().trim().max(20).required(),
    muscleGroups: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    equipment: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    notes: Joi.string().trim().max(MAX_TEXT).allow('').optional()
}).options(joiOptions);

/**
 * Recovery card (POST /calendar3).
 */
export const recoveryCardSchema = Joi.object({
    title: Joi.string().trim().max(MAX_TITLE).required(),
    day: Joi.string().valid(...DAYS).required(),
    time: Joi.string().trim().max(10).required(),
    exerciseType: Joi.string().trim().max(50).required(),
    duration: Joi.number().integer().min(1).max(600).required(),
    intensity: Joi.string().trim().max(20).required(),
    bodyPart: Joi.string().trim().max(200).allow('').optional(),
    precautions: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    equipment: Joi.string().trim().max(MAX_TEXT).allow('').optional(),
    instructions: Joi.string().trim().max(MAX_TEXT).allow('').optional()
}).options(joiOptions);

/**
 * Ask Berry (POST /ask-berry): prompt only.
 */
export const askBerrySchema = Joi.object({
    prompt: Joi.string().trim().max(MAX_PROMPT).required()
}).options(joiOptions);

/**
 * Card type and id for details/delete (params).
 */
export const cardTypeSchema = Joi.string().valid('nutri-card', 'fit-card', 'recovery-card').required();
export const cardIdSchema = Joi.alternatives().try(
    Joi.string().pattern(/^\d+$/),
    Joi.string().uuid()
).required();

// --- API /api/ai schemas (strip unknown, length limits) ---
const MAX_MESSAGE = 2000;
const MAX_GOAL = 200;
const MAX_TOPIC = 200;

export const apiChatSchema = Joi.object({
    message: Joi.string().trim().max(MAX_MESSAGE).required(),
    userGoals: Joi.string().trim().max(MAX_GOAL).allow(null, '').optional(),
    context: Joi.string().trim().max(MAX_TEXT).allow(null, '').optional()
}).options(joiOptions);

export const apiWorkoutPlanSchema = Joi.object({
    goal: Joi.string().trim().max(MAX_GOAL).required(),
    fitnessLevel: Joi.string().trim().max(50).optional(),
    daysPerWeek: Joi.number().integer().min(1).max(7).optional(),
    duration: Joi.number().integer().min(5).max(180).optional(),
    equipment: Joi.string().trim().max(100).optional(),
    preferences: Joi.object().optional()
}).options(joiOptions);

export const apiMealPlanSchema = Joi.object({
    goal: Joi.string().trim().max(MAX_GOAL).required(),
    dietaryRestrictions: Joi.array().items(Joi.string().max(100)).optional(),
    calories: Joi.number().integer().min(500).max(10000).optional(),
    mealsPerDay: Joi.number().integer().min(1).max(6).optional(),
    preferences: Joi.object().optional()
}).options(joiOptions);

export const apiWellnessSchema = Joi.object({
    topic: Joi.string().trim().max(MAX_TOPIC).allow('', null).optional(),
    userGoals: Joi.string().trim().max(MAX_GOAL).allow(null, '').optional(),
    currentHabits: Joi.string().trim().max(MAX_TEXT).allow(null, '').optional()
}).options(joiOptions);

// --- API /api/ninjas query param schemas (length limits) ---
const MAX_QUERY = 300;
const MAX_ITEM = 200;
const MAX_LIMIT = 100;

export const apiNutritionQuerySchema = Joi.object({
    query: Joi.string().trim().max(MAX_QUERY).required()
}).options(joiOptions);

export const apiNutritionItemQuerySchema = Joi.object({
    item: Joi.string().trim().max(MAX_ITEM).required(),
    quantity: Joi.string().trim().max(50).optional()
}).options(joiOptions);

export const apiRecipesQuerySchema = Joi.object({
    query: Joi.string().trim().max(MAX_QUERY).required()
}).options(joiOptions);

export const apiExercisesQuerySchema = Joi.object({
    name: Joi.string().trim().max(MAX_QUERY).optional(),
    type: Joi.string().trim().max(50).optional(),
    muscle: Joi.string().trim().max(100).optional(),
    difficulty: Joi.string().trim().max(20).optional(),
    equipment: Joi.string().trim().max(200).optional()
}).options(joiOptions);

export const apiMuscleParamSchema = Joi.string().trim().max(100).required();

export const apiExercisesMuscleQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional(),
    offset: Joi.number().integer().min(0).optional()
}).options(joiOptions);

export { joiOptions };

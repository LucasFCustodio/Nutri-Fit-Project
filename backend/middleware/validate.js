/**
 * Validation middleware: run Joi schema on req.body or req.params, replace with sanitized value.
 * Returns 400 with clear message on validation error (OWASP: fail securely, no internal details).
 */

/**
 * Validate request body against a Joi schema. Puts validated value in req.validatedBody.
 * @param {Joi.ObjectSchema} schema - Joi schema (with stripUnknown)
 * @param {Object} opts - { htmlResponse: true } to return 400 with simple HTML for form posts
 */
export function validateBody(schema, opts = {}) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: false });
        if (error) {
            const message = error.details.map(d => d.message).join('; ');
            if (opts.htmlResponse) {
                return res.status(400).send(
                    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invalid input</title></head><body><h1>Invalid input</h1><p>Please check your data and try again.</p><a href="javascript:history.back()">Go back</a></body></html>`
                );
            }
            return res.status(400).json({ error: 'Validation failed', message });
        }
        req.validatedBody = value;
        next();
    };
}

/**
 * Validate request params (e.g. type, id). Puts validated in req.validatedParams.
 * Use for routes like /details/:type/:id and /delete/:type/:id.
 */
export function validateParams(typeSchema, idSchema) {
    return (req, res, next) => {
        const typeResult = typeSchema.validate(req.params.type);
        const idResult = idSchema.validate(req.params.id);
        if (typeResult.error || idResult.error) {
            const msg = [typeResult.error, idResult.error].filter(Boolean).map(e => e.message).join('; ');
            return res.status(400).send(msg || 'Invalid parameters');
        }
        req.validatedParams = { type: typeResult.value, id: idResult.value };
        next();
    };
}

/**
 * Validate request query against a Joi schema. Puts result in req.validatedQuery.
 * Use for GET endpoints with query params.
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { stripUnknown: true, abortEarly: false });
        if (error) {
            const message = error.details.map(d => d.message).join('; ');
            return res.status(400).json({ error: 'Validation failed', message });
        }
        req.validatedQuery = value;
        next();
    };
}

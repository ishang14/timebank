// Validates req.body with a Zod schema; errors go to the error handler
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};

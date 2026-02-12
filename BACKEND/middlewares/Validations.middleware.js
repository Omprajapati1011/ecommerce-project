export const validate = (schema, type = "body") => (req, res, next) => {
  try {
    schema.parse(req[type]);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }
};

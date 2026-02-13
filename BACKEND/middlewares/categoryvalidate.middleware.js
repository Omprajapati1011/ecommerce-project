// export const validate = (schema, property = "body") => {
//   return (req, res, next) => {
//     try {
//       const parsed = schema.parse(req[property]);

//       req[property] = parsed;

//       next();
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: err.issues.map((e) => ({
//           field: e.path.join("."),
//           message: e.message,
//         })),
//       });
//     }
//   };
// };

// src/middleware/validate.middleware.js
// export const validate = (schema, property = "body") => {
//   return (req, res, next) => {
//     const result = schema.safeParse(req[property]);

//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: result.error.issues.map((e) => ({
//           field: e.path.join("."),
//           message: e.message,
//         })),
//       });
//     }

//     // ✅ overwrite with parsed & sanitized values
//     req[property] = result.data;

//     next();
//   };
// };

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[property]);

      // store safely (never overwrite express internals)
      req.validated = req.validated || {};
      req.validated[property] = parsed;

      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
  };
};

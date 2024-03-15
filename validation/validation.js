
const { body, validationResult } = require('express-validator')

const userValidationRules = () => {
  return [
    body('name').isLength({ min: 5 }).withMessage('Name must be at least 5 characters long'),
    // body('description').isLength({ min: 5 }).withMessage('Description must be at least 5 characters long'),
  ];
};


const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
  return res.status(422).json({
    errors: extractedErrors,
  })
}
 


module.exports = {
  userValidationRules,
  validate,
}


const Joi = require("@hapi/joi");
const {StatusCodes} = require("../../../Values");

const validate = (req, res, next) => {
  const Schema = Joi.object({
    _id: Joi.string().length(24).required(),
  });
  const {error} = Schema.validate(req.params, {abortEarly: false});
  if (error) {
    return res.status(400).json({statusCode: StatusCodes.ERROR_PARAM, message: error.message});
  }
  next();
};

module.exports = validate;

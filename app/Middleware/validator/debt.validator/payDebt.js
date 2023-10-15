const Joi = require("@hapi/joi");
const {StatusCodes} = require("../../../Values");

/**
 * Pay Debt Validate Module
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const validate = (req, res, next) => {
  const schema = Joi.object({
    fishId: Joi.string().required(),
    paidDate: Joi.string().required(),
    paymentType: Joi.string().valid("CARD_BY_CARD", "POS_MACHINE", "TRANSFER").required(),
  });
  const {error} = schema.validate(req.body, {abortEarly: false});
  if (error) {
    return res.status(400).json({statusCode: StatusCodes.ERROR_PARAM, message: error.message});
  }
  next();
};

module.exports = validate;

//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi");
const { string } = require("joi");

const fragenSchema = new mongoose.Schema({
  frage: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 5000,
    unique: true,
  },
  onTrue: {
    feuer: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    wasser: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    luft: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    erde: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  onFalse: {
    feuer: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    wasser: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    luft: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    erde: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
});

async function validateFrage(frage) {
  console.log(frage);
  const schema = Joi.object({
    frage: Joi.string().min(3).max(5000).required(),
    onTrue: Joi.object({
      feuer: Joi.number().min(0).max(10).required(),
      wasser: Joi.number().min(0).max(10).required(),
      luft: Joi.number().min(0).max(10).required(),
      erde: Joi.number().min(0).max(10).required(),
    }).required(),
    onFalse: Joi.object({
      feuer: Joi.number().min(0).max(10).required(),
      wasser: Joi.number().min(0).max(10).required(),
      luft: Joi.number().min(0).max(10).required(),
      erde: Joi.number().min(0).max(10).required(),
    }).required(),
  });

  const validation = schema.validate(frage);
  return validation;
}

exports.Frage = mongoose.model("Frage", fragenSchema);
exports.validate = validateFrage;

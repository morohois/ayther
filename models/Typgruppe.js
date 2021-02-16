//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { string } = require("joi");

const typgruppenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
    unique: true,
  },
  refUser: {
    type: String,
    required: true,
  },
});

async function validateTypgruppe(typgruppe) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    refUser: Joi.string().min(3).max(255).required(),
  });

  const validation = schema.validate(typgruppe);
  return validation;
}

exports.TypGruppe = mongoose.model("TypGruppe", typgruppenSchema);
exports.validate = validateTypgruppe;

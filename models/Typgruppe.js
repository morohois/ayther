//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi"); //i Joi dient der Validierung von Eingaben
const jwt = require("jsonwebtoken");
const { string } = require("joi");

//++ Mongoose Schema festlegen
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

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateTypgruppe(typgruppe) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    refUser: Joi.string().min(3).max(255).required(),
  });

  const validation = schema.validate(typgruppe); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

exports.TypGruppe = mongoose.model("TypGruppe", typgruppenSchema);
exports.validate = validateTypgruppe;

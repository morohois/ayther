//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi"); //i Joi dient der Validierung von Eingaben
Joi.objectId = require("joi-objectid")(Joi); //i Joi Object dient der Validierung von ObjektIDs
const jwt = require("jsonwebtoken");
const { string, number, required } = require("joi");

//++ Mongoose Schema festlegen
const localTypgruppenSchema = new mongoose.Schema({
  region: {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 150,
    },
    lat: {
      type: Number,
      min: -90,
      max: 90,
      required: true,
    },
    lon: {
      type: Number,
      min: -180,
      max: 180,
      required: true,
    },
  },
  typgruppenID: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 255,
  },
  mitglieder: {
    type: [String],
    default: [],
  },
  veranstaltungen: {
    type: [String],
    default: [],
  },
});

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateLocalTypgruppe(typgruppe) {
  const schema = Joi.object({
    region: Joi.object({
      name: Joi.string().min(3).max(150).required(),
      lat: Joi.number().min(-90).max(90).required(),
      lon: Joi.number().min(-180).max(180).required(),
    }).required(),
    typ: Joi.string().valid("Feuer", "Wasser", "Erde", "Luft"),
  });
  const validation = schema.validate(typgruppe); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

exports.LocalTypGruppe = mongoose.model("LocalTypGruppe", localTypgruppenSchema);
exports.validate = validateLocalTypgruppe;

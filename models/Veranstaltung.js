//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi");
const { string } = require("joi");

const veranstaltungsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },
  zeitpunkt: {
    type: Date,
    required: true,
  },
  ort: {
    name: {
      type: String,
      minlength: 3,
      maxlength: 255,
    },
    adresse: {
      type: String,
      minlength: 3,
      maxlength: 255,
    },
  },
  teilnehmer: [String],
});

async function validateVeranstaltung(veranstaltung) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    aktivitaet: Joi.object({
      name: Joi.string().min(3).max(255).required(),
      kategorien: Joi.array(),
    }).required(),
    Ort: Joi.object({
      name: Joi.string().min(3).max(255).required(),
      adresse: Joi.string().min(3).max(255).required(),
      lat: Joi.number().min(-90).max(90).required(),
      lon: Joi.number().min(-180).max(180).required(),
    }).required(),
    teilnehmer: Joi.array(),
  });

  const validation = schema.validate(veranstaltung);
  return validation;
}

exports.Veranstaltung = mongoose.model("Veranstaltung", veranstaltungsSchema);
exports.validate = validateVeranstaltung;

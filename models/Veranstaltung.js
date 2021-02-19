//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi"); //i Joi dient der Validierung von Eingaben
const { string } = require("joi");

//++ Mongoose Schema festlegen
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
  posts: [
    {
      uID: String,
      message: String,
      time: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  teilnehmer: [String],
});

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateVeranstaltung(veranstaltung) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    aktivitaet: Joi.object({
      name: Joi.string().min(3).max(255),
      kategorien: Joi.array(),
    }),
    ort: Joi.object({
      name: Joi.string().min(3).max(255).required(),
      adresse: Joi.string().min(3).max(255).required(),
      lat: Joi.number().min(-90).max(90),
      lon: Joi.number().min(-180).max(180),
    }).required(),
    teilnehmer: Joi.array(),
    zeitpunkt: Joi.date(),
  });

  const validation = schema.validate(veranstaltung); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

exports.Veranstaltung = mongoose.model("Veranstaltung", veranstaltungsSchema);
exports.validate = validateVeranstaltung;

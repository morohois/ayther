//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi"); //i Joi dient der Validierung von Eingaben
const jwt = require("jsonwebtoken");
const { string } = require("joi");

//++ Mongoose Schema festlegen
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 255,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  typ: {
    type: String,
  },
  role: {
    type: String,
    default: "user",
  },
});

//i Fügt dem Benutzer Schema die generateAuthToken Funktion hinzu, um einen WebToken bei Anmeldung zurückzugeben
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_KEY);
};

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(user); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateUserUpdate(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50),
    interests: Joi.array().items(Joi.string()),
  });

  const validation = schema.validate(user); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

//++ Joi Validiert die Benutzereingaben, ob alle Anforderungen erfüllt sind.
//++ Zur vermeidung von Redundantem Code. Das Schema sollte selbsterklärend sein
async function validateLogin(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(user); //i Prüfen ob die Anfrage dem Schema entspricht
  return validation;
}

exports.User = mongoose.model("User", userSchema);
exports.validate = validateUser;
exports.validateUpdate = validateUserUpdate;
exports.validateLogin = validateLogin;

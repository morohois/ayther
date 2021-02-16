//----------------------------------
//i ---------MONGO DB MODEL---------
//----------------------------------

const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { string } = require("joi");

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
  role: {
    type: String,
    default: "user",
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_KEY);
};

async function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(user);
  return validation;
}

async function validateUserUpdate(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50),
    interests: Joi.array().items(Joi.string()),
  });

  const validation = schema.validate(user);
  return validation;
}
async function validateLogin(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(user);
  return validation;
}

exports.User = mongoose.model("User", userSchema);
exports.validate = validateUser;
exports.validateUpdate = validateUserUpdate;
exports.validateLogin = validateLogin;

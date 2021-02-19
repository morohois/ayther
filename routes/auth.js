/*
i ------------------------------------------
i ----------ROUTING FILE (AUTH)------------
i ------------------------------------------
*/

//++ Auth dient dazu den Benutzer einzuloggen

//i importing the basic functionality of Routing via express
const express = require("express");
const router = express.Router();
const { Logger } = require("../logging/logger"); //i Schönere Konsolenausgabe
const bcrypt = require("bcrypt"); //i BCRYPT Hashed Passwörter etc.
const jwt = require("jsonwebtoken");
const { errorHandler } = require("../middleware/errorHandler"); //i siehe middleware/errorHandler
const mask = require("json-mask"); //i JSON Mask wählt lediglich die gewünschten Schlüssel aus einem Objekt

//i importing the DB-models needed
const { User, validateLogin } = require("../models/User");

//++ Login User
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "username,password"); //i Lediglich Usernamen und Passwort aus dem Body ziehen alles andere weg
    const { error } = await validateLogin(req.body); //i siehe validator Joi funktion
    if (error) return res.status(400).json({ error: error.details[0].message }); //i wenn Schema nicht eingehalten
    const user = await User.findOne({ username: req.body.username });
    if (!user)
      return res.status(400).json({
        error: `Invalid Username or password!`,
      }); //i Benutzer wurde nicht gefunden

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword)
      return res.status(400).json({
        error: `Invalid Username or password!`,
      }); //i Passwort stimmt nicht überein

    const token = user.generateAuthToken(); //i Token generieren um den Benutzer in Zukunft wieder zu erkennen
    res.status(200).json({ jwt: token, id: user._id });
  })
);
module.exports = router;

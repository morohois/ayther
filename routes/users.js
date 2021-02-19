/*
i ------------------------------------------
i ----------ROUTING FILE (USERS)------------
i ------------------------------------------
*/

//i importing the basic functionality of Routing via express
const express = require("express");
const router = express.Router();
const { Logger } = require("../logging/logger"); //i Schönere Konsolenausgabe
const _ = require("lodash"); //i Als Alternative für JSON-MASK
const bcrypt = require("bcrypt"); //i Zum Hashing von Passwörtern
const auth = require("../middleware/auth"); //i siehe middleware/auth

const { errorHandler } = require("../middleware/errorHandler"); //i siehe middleware/errorHandler
const mask = require("json-mask"); //i JSON Mask wählt lediglich die gewünschten Schlüssel aus einem Objekt

//i importing the DB-models needed
const { User, validate } = require("../models/User");

//++ Benutzer dem System hinzufügen
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "username,email,password"); //i Nur wichtige Schlüssel übernehmen
    const { error } = await validate(req.body); //i siehe validator Joi funktion
    if (error) return res.status(400).json({ error: error.details[0].message }); //i wenn Schema nicht eingehalten
    if (await User.exists({ username: req.body.username }))
      return res.status(400).json({
        error: `User with name ${req.body.username} already exists!`,
      }); //i Username bereits existent? Vergeben etc.
    if (await User.exists({ email: req.body.email }))
      return res.status(400).json({
        error: `Die Email wird bereits verwendet!`,
      }); //i Email bereits in verwendung?

    newUser = new User(_.pick(req.body, ["username", "email", "password"]));

    const salt = await bcrypt.genSalt(10); //i Für Passwort Salt generieren
    newUser.password = await bcrypt.hash(newUser.password, salt); //i Passwort für die Speicherung auf DB Hashen

    const savedUser = await newUser.save();
    if (savedUser == null) return res.status(500).json({ error: "User couldn't be saved! Please try again!" });

    const token = savedUser.generateAuthToken(); //i Wenn user erfolgreich registriert wird ein WebToken übergeben
    res.header("x-auth-token", token).send(_.pick(savedUser, ["_id", "username", "email"]));
  })
);

//++ Alle Benutzer ausgeben
router.get("/", async (req, res) => {
  const users = await User.find().select({ username: 1 });
  res.json(users);
});

//++ Spezifischen Benutzer löschen
router.delete("/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(await User.exists({ _id: req.user._id }))) return res.status(410).send("User could not longer be found!");
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized");

    const deletedUser = await User.findByIdAndDelete({ _id: req.user._id });

    if (!deletedUser) return res.status(500).send("Something went wrong, please try again later!");

    res.status(200).send(`User ${deletedUser.username} was deleted!`);
  }),
]);

//++ Unkritische Informationen zu Benutzer ausgeben (Username und Typ)
router.get(
  "/:id",
  errorHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(401).send("User could not be found!");
    res.send(_.pick(user, ["username", "typ"]));
  })
);

//++ Alle Informationen zu einem Benutzer ausgeben
router.get("/private/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized"); //i Auth legt das req.user objekt an und entschlüsselt die id des Benutzers aus dem übergebenen JWT

    const user = await User.findById(req.user._id);
    res.send(_.pick(user, ["_id", "username", "email"]));
  }),
]);

//++ Benutzer bearbeiten
router.put("/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized"); //i Auth legt das req.user objekt an und entschlüsselt die id des Benutzers aus dem übergebenen JWT

    const user = await User.findById(req.user._id);

    user.set(req.body);

    const savedUser = await user.save();

    res.send(_.pick(savedUser, ["_id", "username", "email", "typ"]));
  }),
]);

module.exports = router;

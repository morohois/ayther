/*
i ------------------------------------------
i ----------ROUTING FILE (USERS)------------
i ------------------------------------------
*/

//++ Fragen sind die fragen die gestellt werden um einen Benutzer in eine bestimmte Gruppe einordnen zu können

//i importing the basic functionality of Routing via express
const express = require("express");
const router = express.Router();
const { Logger } = require("../logging/logger"); //i Schönere Konsolenausgabe
const _ = require("lodash"); //i als ersatz für JSON Mask
const auth = require("../middleware/auth"); //i siehe middleware/auth
const { errorHandler } = require("../middleware/errorHandler"); //i siehe middleware/errorHandler
const mask = require("json-mask"); //i JSON Mask wählt lediglich die gewünschten Schlüssel aus einem Objekt

//++ importing the DB-models needed
const { User } = require("../models/User");
const { Frage, validate } = require("../models/Frage");
const { Mongoose, isValidObjectId } = require("mongoose");
const { randomInt } = require("crypto");

//++ Register Question
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "frage,onTrue(feuer,wasser,luft,erde),onFalse(feuer,wasser,luft,erde)");
    const { error } = await validate(req.body); //i siehe validator Joi funktion
    if (error) return res.status(400).send(error.details[0].message); //i wenn Schema nicht eingehalten
    if (await Frage.exists({ frage: req.body.frage }))
      return res.status(400).json({
        error: `Diese Frage existiert bereits!`,
      }); //i Checken ob die selbe Frage zwei mal ageschickt wurde

    newFrage = new Frage(_.pick(req.body, ["frage", "onTrue", "onFalse"])); //i ansonsten anlegen...

    const savedFrage = await newFrage.save(); //i ... und speichern
    if (savedFrage == null) return res.status(500).json({ error: "Frage konnte nicht gespeichert werden!" }); //i Falls fehler abbrechen

    res.send(savedFrage);
  })
);

//++ Get Alle Fragen
router.get("/", async (req, res) => {
  const fragen = await Frage.find();
  res.send(fragen);
});

//++ Zufällige Fragen erhalten Menge bestimmt
router.get(
  "/random/:count",
  errorHandler(async (req, res) => {
    let fragen = await Frage.find(); //i alle fragen ziehen

    //i Wenn mehr fragen oder genau so viele Fragen wie vorhanden gefordert wurden sollen alle vorhandenen Fragen zurück gegeben werden
    if (fragen.length <= req.params.count) return res.send(fragen);
    let fragenChoice = []; //i Container für die Augewählten fragen
    do {
      takeAway = randomInt(fragen.length); //i Zufällige Zahl definieren
      fragenChoice.push(fragen[takeAway]); //i Zufällige frage dem Container hinzufügen
      fragen.splice(takeAway, 1); //i Zur vermeidung von Dublikaten die Frage entfernen
    } while (fragenChoice.length < req.params.count || fragen.length == 0); //i Solange bis die gewünschte Menge erreicht ist oder keine Fragen mehr da sind

    res.send(fragenChoice);
  })
);

//++ Einzelne Frage löschen
router.delete(
  "/:id",
  errorHandler(async (req, res) => {
    if (!Frage.exists({ _id: req.params.id }))
      //i Frage existent?
      return res.status(401).json({ error: "Frage konnte nicht gefunden werden!" });
    const deletedFrage = await Frage.findByIdAndDelete({
      _id: req.params.id,
    }); //I Wenn ja dann löschen

    if (!deletedFrage) return res.status(500).send("Something went wrong, please try again later!"); //i Prüfen ob löschen geklappt hat

    res.status(200).send(`Frage "${deletedFrage.frage}" wurde gelöscht!`);
  })
);
//++ Einzelne Frage erhalten
router.get(
  "/:id",
  errorHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.send("Die angegebene ID ist nicht gültig!"); //i ID richtig (Format)
    const frage = await Frage.findById(req.params.id); //i Frage vorhanden?
    if (!frage) return res.status(401).send("Die Frage konnte nicht gefunden werden!");
    res.send(frage);
  })
);

//++ Frage bearbeiten
router.put(
  "/:id",
  errorHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.send("Die angegebene ID ist nicht gültig!"); //i ID richtiges Format?
    let frage = await Frage.findById(req.params.id);
    if (!frage) return res.status(401).send("Die Frage konnte nicht gefunden werden!"); //i Frage (ID) existiert nicht

    frage.set(req.body); //i JSON.set überschreibt lediglich die gegebenen Werte. Der Rest bleibt gleich
    //i Falls man also nur die Punkte ändern möchte oder auch nur bestimmte Punkte

    const savedFrage = await frage.save(); 
    if (!savedFrage) return res.status(500).json({ error: "Fehler beim Speichern der Frage!" }); //i Speichern geklappt?

    res.send(savedFrage);
  })
);

//i simply returns a random Integer from 0 to max
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = router;

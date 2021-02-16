/*
i ------------------------------------------
i ----------ROUTING FILE (USERS)------------
i ------------------------------------------
*/

//i importing the basic functionality of Routing via express
const express = require("express");
const { Logger } = require("../logging/logger");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const { errorHandler } = require("../middleware/errorHandler");
const mask = require("json-mask");

//i importing the DB-models needed
const { User } = require("../models/User");
const { Frage, validate } = require("../models/Frage");
const { Mongoose, isValidObjectId } = require("mongoose");
const { randomInt } = require("crypto");

//i Register Question
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(
      req.body,
      "frage,onTrue(feuer,wasser,luft,erde),onFalse(feuer,wasser,luft,erde)"
    );
    const { error } = await validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (await Frage.exists({ frage: req.body.frage }))
      return res.status(400).json({
        error: `Diese Frage existiert bereits!`,
      });

    newFrage = new Frage(_.pick(req.body, ["frage", "onTrue", "onFalse"]));

    const savedFrage = await newFrage.save();
    if (savedFrage == null)
      return res
        .status(500)
        .json({ error: "Frage konnte nicht gespeichert werden!" });

    res.send(savedFrage);
  })
);

router.get("/", async (req, res) => {
  const fragen = await Frage.find();
  res.send(fragen);
});

router.get(
  "/random/:count",
  errorHandler(async (req, res) => {
    let fragen = await Frage.find();
    if (fragen.length <= req.params.count) return res.send(fragen);

    let fragenChoice = [];
    do {
      takeAway = randomInt(fragen.length);
      fragenChoice.push(fragen[takeAway]);
      fragen.splice(takeAway, 1);
      console.log(
        `und Noch eine Rundee! | ${fragenChoice} - ${fragen.length} - ${req.params.count} `
      );
    } while (fragenChoice.length < req.params.count || fragen.length == 0);

    res.send(fragenChoice);
  })
);

router.delete(
  "/:id",
  errorHandler(async (req, res) => {
    if (!Frage.exists({ _id: req.params.id }))
      return res
        .status(401)
        .json({ error: "Frage konnte nicht gefunden werden!" });
    const deletedFrage = await Frage.findByIdAndDelete({
      _id: req.params.id,
    });

    if (!deletedFrage)
      return res
        .status(500)
        .send("Something went wrong, please try again later!");

    res.status(200).send(`Frage "${deletedFrage.frage}" wurde gelöscht!`);
  })
);

router.get(
  "/:id",
  errorHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id))
      return res.send("Die angegebene ID ist nicht gültig!");
    const frage = await Frage.findById(req.params.id);
    if (!frage)
      return res.status(401).send("Die Frage konnte nicht gefunden werden!");
    res.send(frage);
  })
);

router.put(
  "/:id",
  errorHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id))
      return res.send("Die angegebene ID ist nicht gültig!");
    let frage = await Frage.findById(req.params.id);
    if (!frage)
      return res.status(401).send("Die Frage konnte nicht gefunden werden!");

    frage.set(req.body);

    const savedFrage = await frage.save();

    res.send(savedFrage);
  })
);

//i simply returns a random Integer from 0 to max
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = router;

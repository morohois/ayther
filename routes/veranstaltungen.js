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

const { errorHandler } = require("../middleware/errorHandler");
const mask = require("json-mask");

const generate = require("../functions/generate");

//i importing the DB-models needed
const { Veranstaltung, validate } = require("../models/Veranstaltung");
const { User } = require("../models/User");
const { LocalTypGruppe } = require("../models/LocalTypGruppe");

router.get(
  "/",
  errorHandler(async (req, res) => {
    const veranstaltungen = await Veranstaltung.find();
    if (veranstaltungen.length == 0) return res.status(404).send("Scheinbar existieren noch keine Veranstaltungen!");
    res.send(veranstaltungen);
  })
);

router.get(
  "/:uid",
  errorHandler(async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ Error: "Bitte gib eine User ID an" });
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(400).json({ Error: "Bitte gib eine gültige User ID an" });

    const veranstaltungen_id = await LocalTypGruppe.find({ mitglieder: req.params.uid }).select({
      _id: 0,
      veranstaltungen: 1,
    });

    let veranstaltungen = [];

    for (i = 0; i < veranstaltungen_id.length; i++) {
      veranstaltungTemp = await Veranstaltung.findById(veranstaltungen_id[i].veranstaltungen);
      veranstaltungen.push(veranstaltungTemp);
    }

    if (veranstaltungen.length == 0)
      return res.status(404).json({ error: "Scheinbar existieren noch keine Veranstaltungen für dich!" });

    res.json(veranstaltungen);
  })
);

router.post(
  "/",
  errorHandler(async (req, res) => {
    //----------------------------------
    req.body = mask(req.body, "name,aktivitaet(name,kategorien),zeitpunkt,ort(name,adresse,lat,lon)");
    const { error } = await validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    newVeranstaltung = new Veranstaltung(req.body);

    const savedVeranstaltung = await newVeranstaltung.save();
    if (savedVeranstaltung == null)
      return res.status(500).json({ error: "Veranstaltung konnte nicht gespeichert werden!" });

    res.send(savedVeranstaltung);
    //----------------------------------
  })
);

router.post(
  "/generate",
  errorHandler(async (req, res) => {
    //----------------------------------

    await generate();

    res.send("testing");
    //----------------------------------
  })
);

module.exports = router;

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
const { LocalTypGruppe, validate } = require("../models/LocalTypGruppe");
const { TypGruppe } = require("../models/Typgruppe");
const { User } = require("../models/User");

router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "region(name,lat,lon),typ");
    const { error } = await validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (await LocalTypGruppe.exists({ "region.name": req.body.name }))
      return res.status(400).json({
        error: `Diese lokale Typgruppe existiert bereits!`,
      });

    let typGruppenId = (await TypGruppe.findOne({ name: req.body.typ }))._id;

    newLocalTypGruppe = new LocalTypGruppe(_.pick(req.body, ["region"]));
    newLocalTypGruppe.set({
      typgruppenID: typGruppenId,
    });
    const savedLocalTypGruppe = await newLocalTypGruppe.save();
    if (savedLocalTypGruppe == null)
      return res.status(500).json({ error: "Lokale TypGruppe konnte nicht gespeichert werden!" });

    res.send(savedLocalTypGruppe);
  })
);

router.get(
  "/",
  errorHandler(async (req, res) => {
    const localTypGruppen = await LocalTypGruppe.find();
    if (!localTypGruppen) return res.status(401).send("Keine Lokalen Typgruppen gefunden!");
    res.send(localTypGruppen);
  })
);

router.get(
  "/near",
  errorHandler(async (req, res) => {
    const userLat = req.query.lat;
    const userLon = req.query.lon;
    if (!userLat || !userLon) return res.send("Latitude und Longitude müssen in die Query!");
    if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180)
      return res.send("Die Koordinaten sind falsch!");

    const LocalTypGruppen = await LocalTypGruppe.find();
    let selectGruppen = [];

    LocalTypGruppen.forEach((local) => {
      if (getDistance(local.region.lat, local.region.lon, userLat, userLon) < 20000) selectGruppen.push(local);
    });

    if (selectGruppen.length <= 0) return res.send("Es konnte keine TypGruppe in deiner Näher gefunden werden!");

    res.send(selectGruppen);
  })
);

router.get(
  "/near/veranstaltungen",
  errorHandler(async (req, res) => {
    const userLat = req.query.lat;
    const userLon = req.query.lon;
    if (!userLat || !userLon) return res.send("Latitude und Longitude müssen in die Query!");
    if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180)
      return res.send("Die Koordinaten sind falsch!");

    const LocalTypGruppen = await LocalTypGruppe.find();
    let selectGruppen = [];

    LocalTypGruppen.forEach((local) => {
      if (getDistance(local.region.lat, local.region.lon, userLat, userLon) < 20000) selectGruppen.push(local);
    });

    if (selectGruppen.length <= 0) return res.send("Es konnte keine TypGruppe in deiner Näher gefunden werden!");

    let veranstaltungen = [];
    await selectedGruppen.forEach(async (gruppe) => {});
    res.send("Testing State");
  })
);

router.get(
  "/:id",
  errorHandler(async (req, res) => {
    const localTypGruppe = await LocalTypGruppe.findById(req.params.id);
    if (!localTypGruppe) return res.status(401).send("Konnte die Lokale Typgruppe nicht finden!");
    res.send(localTypGruppe);
  })
);

router.delete(
  "/:id",
  errorHandler(async (req, res) => {
    if (!(await LocalTypGruppe.exists({ _id: req.params.id })))
      return res.status(410).send("Lokale TypGruppe existiert nicht!");

    const deletedGruppe = await LocalTypGruppe.findByIdAndDelete({
      _id: req.params.id,
    });

    if (!deletedGruppe) return res.status(500).send("Something went wrong, please try again later!");

    res.status(200).send(`Gruppe ${deletedGruppe.region.name} wurde gelöscht!`);
  })
);

router.post(
  "/:id/mitglieder",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "userID");
    if (!(await User.exists({ _id: req.body.userID }))) return res.status(401).send("UserID ist nicht vergeben!");
    const typgruppe = await LocalTypGruppe.findById(req.params.id);
    typgruppe.mitglieder.push(req.body.userID);
    const savedGruppe = await typgruppe.save();
    res.send(savedGruppe);
  })
);

router.get("/coordtest", (req, res) => {
  const userLat = req.query.lat;
  const userLon = req.query.lon;
  console.log(userLat + " " + userLon);
  console.log(getDistance(userLat, userLon, 50.915057352433585, 7.211428980648701));
  res.send("Test");
});

module.exports = router;

function getDistance(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180,
    φ2 = (lat2 * Math.PI) / 180,
    Δλ = ((lon2 - lon1) * Math.PI) / 180,
    R = 6371e3;
  return Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R;
}

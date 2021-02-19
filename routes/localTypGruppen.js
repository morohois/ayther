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
const auth = require("../middleware/auth"); //i siehe middleware/auth

const { errorHandler } = require("../middleware/errorHandler"); //i siehe middleware/errorHandler
const mask = require("json-mask"); //i JSON Mask wählt lediglich die gewünschten Schlüssel aus einem Objekt

//++ importing the DB-models needed
const { LocalTypGruppe, validate } = require("../models/LocalTypGruppe");
const { TypGruppe } = require("../models/Typgruppe");
const { User } = require("../models/User");

//++ Lokale TypGruppe erstellen
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "region(name,lat,lon),typ"); //i Nur gegebenen Werte aus Body übernehmen. Der Rest kann weg
    const { error } = await validate(req.body); //i siehe validator Joi funktion
    if (error) return res.status(400).send(error.details[0].message); //i wenn Schema nicht eingehalten

    let typGruppenId = (await TypGruppe.findOne({ name: req.body.typ }))._id; //i ID der verlinkten TypGruppe suchen, damit der TypName leserlich übergeben werden kann (Feuer,Wasser,Erde,Luft)

    newLocalTypGruppe = new LocalTypGruppe(_.pick(req.body, ["region"])); //i Lokale Typgruppe anlegen, nur die region aus dem Body verwenden
    newLocalTypGruppe.set({
      typgruppenID: typGruppenId,
    }); //i TypGruppen ID entsprechend nachtragen
    const savedLocalTypGruppe = await newLocalTypGruppe.save(); //i Speichern
    if (savedLocalTypGruppe == null)
      return res.status(500).json({ error: "Lokale TypGruppe konnte nicht gespeichert werden!" }); //i Fehler beim Speichern?

    res.send(savedLocalTypGruppe);
  })
);

//++ Alle Lokalen TypGruppen ausgeben
router.get(
  "/",
  errorHandler(async (req, res) => {
    const localTypGruppen = await LocalTypGruppe.find();
    if (!localTypGruppen) return res.status(401).send("Keine Lokalen Typgruppen gefunden!");
    res.send(localTypGruppen);
  })
);

//++ Lokale Typgruppen anhand der übergebenen Position ausgeben (Siehe GetDistance)
router.get(
  "/near",
  errorHandler(async (req, res) => {
    const userLat = req.query.lat; //i Latitude
    const userLon = req.query.lon; //i Longitude
    const typ = req.query.typ; //i Übergebener Typ (Feuer,Wasser...)
    if (!userLat || !userLon || !typ)
      return res.send("Latitude und Longitude müssen in die Query, sowie der der Typ der Gruppe!"); //i Ist alles benötigte angegeben?
    if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180)
      //i Koordinaten im gültigen Wertebereich?
      return res.send("Die Koordinaten sind falsch!");

    const typgruppe = await TypGruppe.findOne({ name: typ }); //i ID der jeweiligen TypGruppe suchen
    if (!typgruppe) return res.json({ error: "Der angegebene Typ existiert nicht!" }); //i Gefunden?
    const LocalTypGruppen = await LocalTypGruppe.find({ typgruppenID: typgruppe._id }); //i Lokale Typgruppe mit der entsprechenden ID suchen
    let selectGruppen = []; //i Container für Gruppen
    LocalTypGruppen.forEach((local) => {
      if (getDistance(local.region.lat, local.region.lon, userLat, userLon) < 20000) selectGruppen.push(local);
    }); //i Für jede Lokale Typ Gruppe überprüfen ob die Benutzerposition in einem Umkreis von 20km Luftlinie liegt.

    if (selectGruppen.length <= 0) return res.send("Es konnte keine TypGruppe in deiner Näher gefunden werden!");

    res.send(selectGruppen);
  })
);

//++ Bestimmte Lokale TypGruppe ausgeben
router.get(
  "/:id",
  errorHandler(async (req, res) => {
    const localTypGruppe = await LocalTypGruppe.findById(req.params.id);
    if (!localTypGruppe) return res.status(401).send("Konnte die Lokale Typgruppe nicht finden!");
    res.send(localTypGruppe);
  })
);

//++ MItglied aus !!ALLEN!! Lokalen Typ Gruppe entfernen
//i Sollte sich ein Benutzer dazu entscheiden seinen Typ zu wechseln
router.delete(
  "/mitglieder",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "userID"); //i Nur den Benutzer aus DB nehmen
    if (!(await User.exists({ _id: req.body.userID }))) return res.status(401).send("UserID ist nicht vergeben!"); //i User existent?
    const typgruppen = await LocalTypGruppe.find({ mitglieder: req.body.userID }); //i Alle Typgruppen suchen in denen der Benutzer angemeldet ist
    if (!typgruppen) return res.status(400).json({ error: "Benutzer gehört keiner Gruppe an!" });

    typgruppen.forEach(async (typgruppe) => {
      typgruppe.mitglieder.splice(typgruppe.mitglieder.indexOf(req.body.userID), 1); //i Aus Array entfernen
      const check = await typgruppe.save(); //i Speichern
      if (!check) return res.status(500).json({ error: "Etwas mit der Datenbank ist schief gelaufen" });
    }); //i Durch die Gruppen iterieren und den Benutzer daraus entfernen

    res.json({ success: "Nutzer wurde aus den Gruppen entfernt" });
  })
);

//++ Lokale TypGruppe Löschen
router.delete(
  "/:id",
  errorHandler(async (req, res) => {
    if (!(await LocalTypGruppe.exists({ _id: req.params.id })))
      //i Gruppe existent?
      return res.status(410).send("Lokale TypGruppe existiert nicht!");
    const deletedGruppe = await LocalTypGruppe.findByIdAndDelete({
      _id: req.params.id,
    });
    if (!deletedGruppe) return res.status(500).send("Something went wrong, please try again later!");
    res.status(200).send(`Gruppe ${deletedGruppe.region.name} wurde gelöscht!`);
  })
);

//++ User zu Mitgliedern einer Lokalen TypGruppe hinzufügen
router.post(
  "/:id/mitglieder",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "userID"); //i Nur User ID übernehmen
    if (!(await User.exists({ _id: req.body.userID }))) return res.status(401).send("UserID ist nicht vergeben!");
    const typgruppe = await LocalTypGruppe.findById(req.params.id);
    if (!typgruppe) return res.status(400).json({ error: "TypGruppen ID falsch oder nicht existent" });

    if (typgruppe.mitglieder.indexOf(req.body.userID) != -1) //i Benutzer im mitgliederarray enthalten?
      return res.status(400).json({ error: "User ist bereits teil dieser Gruppe" });

    typgruppe.mitglieder.push(req.body.userID); //i Benutzer dem MitgliederArray hinzufügen
    const savedGruppe = await typgruppe.save();
    res.send(savedGruppe);
  })
);
//++ Lokale TypGruppen ausgeben in denen ein Bestimmter Benutzer Mitglied ist
router.get(
  "/mitglieder/:id",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "userID");
    if (!(await User.exists({ _id: req.params.id }))) return res.status(401).send("UserID ist nicht vergeben!");
    const typgruppen = await LocalTypGruppe.find({ mitglieder: req.params.id });

    if (!typgruppen) return res.status(400).json({ error: "User ist Mitglied keiner Gruppe!" });

    res.send(typgruppen);
  })
);

//++ Mitglied aus Lokaler TypGruppe entfernen
router.delete(
  "/:id/mitglieder",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "userID");
    if (!(await User.exists({ _id: req.body.userID }))) return res.status(401).send("UserID ist nicht vergeben!");
    const typgruppe = await LocalTypGruppe.findById(req.params.id);

    if ((typgruppe.mitglieder.indexOf(req.body.userID) = -1))
      return res.status(400).json({ error: "User ist kein Mitglied in dieser Gruppe" });

    typgruppe.mitglieder.splice(typgruppe.mitglieder.indexOf(req.body.userID), 1);
    const updateGruppe = await typgruppe.save();
    res.send(updateGruppe);
  })
);

module.exports = router;

//++ GetDistance überprüft die Luftlinien Distanz zwischen zwei Koordinaten.
function getDistance(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180,
    φ2 = (lat2 * Math.PI) / 180,
    Δλ = ((lon2 - lon1) * Math.PI) / 180,
    R = 6371e3;
  return Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R;
}

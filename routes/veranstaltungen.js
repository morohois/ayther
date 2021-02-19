/*
i ------------------------------------------
i ----------ROUTING FILE (USERS)------------
i ------------------------------------------
*/

//i importing the basic functionality of Routing via express
const express = require("express");
const { Logger } = require("../logging/logger"); //i Schönere Konsolenausgabe
const router = express.Router();
const _ = require("lodash");

const { errorHandler } = require("../middleware/errorHandler"); //i siehe middleware/errorHandler
const mask = require("json-mask"); //i JSON Mask wählt lediglich die gewünschten Schlüssel aus einem Objekt

const generate = require("../functions/generate");

//i importing the DB-models needed
const { Veranstaltung, validate } = require("../models/Veranstaltung");
const { User } = require("../models/User");
const { LocalTypGruppe } = require("../models/LocalTypGruppe");

//++ Alle Veranstaltungen ausgeben
router.get(
  "/",
  errorHandler(async (req, res) => {
    const veranstaltungen = await Veranstaltung.find();
    if (veranstaltungen.length == 0) return res.status(404).send("Scheinbar existieren noch keine Veranstaltungen!");
    res.send(veranstaltungen);
  })
);
//++ Bestimmte Veranstaltung ausgeben
router.get(
  "/:id",
  errorHandler(async (req, res) => {
    const veranstaltung = await Veranstaltung.findById(req.params.id);
    if (!veranstaltung) return res.status(404).send("Diese Veranstaltung exisitiert nicht!");

    res.send(veranstaltung);
  })
);
//++ Alle Veranstaltungen löschen (Debugging)
router.delete("/all", async (req, res) => {
  const del = await Veranstaltung.deleteMany({});
  res.send("deleted");
});

//++ Einen Post zu einer Veranstaltung hinzufügen
router.post(
  "/:id/posts",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "uid,message"); //i User ID und Message extrahieren
    if (!(await User.exists({ _id: req.body.uid }))) return res.status(400).json({ error: "User existiert nicht!" });
    const veranstaltung = await Veranstaltung.findOne({ _id: req.params.id });
    if (!veranstaltung) return res.status(400).json({ error: "Veranstaltung existiert nicht!" });

    if (veranstaltung.teilnehmer.indexOf(req.body.uid) == -1)
      return res.status(400).json({ error: "User ist kein Teilnehmer der Veranstaltung!" });

    veranstaltung.posts.unshift({ uID: req.body.uid, message: req.body.message }); //i Wichtig! Den Post an den Anfang setzen, damit die Reihenfolge korrekt bleibt und die neusten Posts oben stehen

    const savedVeranstaltung = await veranstaltung.save();

    res.send(savedVeranstaltung.posts);
  })
);

//++ Alle Posts einer Veranstaltung ausgeben
router.get(
  "/:id/posts",
  errorHandler(async (req, res) => {
    const veranstaltungen = await Veranstaltung.findById(req.params.id).select({ _id: 0, posts: 1 });
    if (!veranstaltungen) return res.status(401).json({ error: "Keine Posts gefunden!" });
    posts = []; //i Container für Posts

    for (i = 0; i < veranstaltungen.posts.length; i++) {
      const user = (await User.findById(veranstaltungen.posts[i].uID)).username;
      posts.push({ user: user, message: veranstaltungen.posts[i].message });
    } //i Für jede UserID den BNenutzernamen suchen und hinterlegen

    res.send(posts);
  })
);

//++ Alle Posts aus Veranstaltung entfernen
router.delete(
  "/:id/posts",
  errorHandler(async (req, res) => {
    const veranstaltungen = await Veranstaltung.findById(req.params.id);
    if (!veranstaltungen) return res.status(401).json({ error: "Keine Posts gefunden!" });

    veranstaltungen.posts = []; //i Post Array Leeren
    const savedVeranstaltung = await veranstaltungen.save();
    res.send(savedVeranstaltung.posts);
  })
);

//++ Benutzer zu Teilnehmern einer Veranstaltung hinzufügen
router.post(
  "/:id/teilnehmer",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "uid");
    if (!(await User.exists({ _id: req.body.uid }))) return res.status(400).json({ error: "User existiert nicht!" });

    const veranstaltung = await Veranstaltung.findOne({ _id: req.params.id });
    if (!veranstaltung) return res.status(400).json({ error: "Veranstaltung existiert nicht!" });

    if (veranstaltung.teilnehmer.indexOf(req.body.uid) != -1)
      return res.status(400).json({ error: "User ist bereits Teilnehmer!" });

    veranstaltung.teilnehmer.push(req.body.uid); //i User ID dem Teilnehmerarray hinzufügen

    const savedVeranstaltung = await veranstaltung.save();

    res.send(savedVeranstaltung);
  })
);

//++ Benutzer aus den Teilnehmern einer Veranstaltung entfernen
router.delete(
  "/:id/teilnehmer",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "uid");
    if (!(await User.exists({ _id: req.body.uid }))) return res.status(400).json({ error: "User existiert nicht!" });

    const veranstaltung = await Veranstaltung.findOne({ _id: req.params.id });
    if (!veranstaltung) return res.status(400).json({ error: "Veranstaltung existiert nicht!" });

    if (veranstaltung.teilnehmer.indexOf(req.body.uid) == -1)
      return res.status(400).json({ error: "User ist kein Teilnehmer!" });

    veranstaltung.teilnehmer.splice(veranstaltung.teilnehmer.indexOf(veranstaltung.teilnehmer), 1);

    const savedVeranstaltung = await veranstaltung.save();

    res.send(savedVeranstaltung);
  })
);

//++ Veranstaltungen erhalten, in denen ein bestimmter Benutzer teilnehmer ist.
router.get(
  "/teilnehmer/:uid",
  errorHandler(async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ Error: "Bitte gib eine User ID an" });
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(400).json({ Error: "Bitte gib eine gültige User ID an" });

    const locals = await LocalTypGruppe.find({ mitglieder: req.params.uid }).select({
      _id: 0,
      veranstaltungen: 1,
    });

    const angemeldeteVeranstaltungen = await Veranstaltung.find({ teilnehmer: req.params.uid });

    //i Alle Veranstaltungen für die der Benutzer schon angemeldet ist egal ob er der Gruppe aktuell angehört
    //i Sollen ebenfalls übertragen werden
    let veranstaltungen = angemeldeteVeranstaltungen;

    //i Alles was zu den Lokalen Typ Gruppen gefunden werden kann an Veranstaltungen mit in den Container rein
    for (a = 0; a < locals.length; a++) {
      for (i = 0; i < locals[a].veranstaltungen.length; i++) {
        let veranstaltungTemp = await Veranstaltung.findById(locals[a].veranstaltungen[i]);
        if (veranstaltungTemp) {
          //i Prüfen ob die Veranstaltung bereits im Container enthalten ist. (Durch die Übertragung der Angemeldeten Veranstaltungen)
          if (
            veranstaltungen.findIndex((e) => {
              return String(e._id) == String(veranstaltungTemp._id);
            }) == -1
          )
            veranstaltungen.push(veranstaltungTemp);
        }
      }
    }
    if (veranstaltungen.length == 0)
      return res.status(400).json({ error: "Scheinbar existieren noch keine Veranstaltungen für dich!" });
    res.json(veranstaltungen);
  })
);

//++ Veranstaltung manuell erstellen ( normalerweise durch generate )
router.post(
  "/",
  errorHandler(async (req, res) => {
    //----------------------------------

    const gruppenID = req.body.gruppe;

    req.body = mask(req.body, "name,zeitpunkt,ort(name,adresse)");
    const { error } = await validate(req.body); //i siehe validator Joi funktion
    if (error) return res.status(400).send(error.details[0].message); //i wenn Schema nicht eingehalten

    const gruppe = await LocalTypGruppe.findById(gruppenID);
    if (!gruppe) return res.status(400).json({ error: "Gruppe existiert nicht!" });

    newVeranstaltung = new Veranstaltung(req.body);

    const savedVeranstaltung = await newVeranstaltung.save();
    if (savedVeranstaltung == null)
      return res.status(500).json({ error: "Veranstaltung konnte nicht gespeichert werden!" });
    gruppe.veranstaltungen.push(savedVeranstaltung._id);
    if (!(await gruppe.save()))
      return res.status(500).json({ error: "Die Veranstaltung konnte der Gruppe nicht hinzugefügt werden!" });

    res.send(savedVeranstaltung);
    //----------------------------------
  })
);

//++ Veranstaltungen automatisch generieren für jede LokaleTypGruppe - Manuell ausgelöst ( Normalerweise alle 24 Stunden )
router.post(
  "/generate",
  errorHandler(async (req, res) => {
    //----------------------------------

    await generate(); //! siehe function/Generate

    res.send("Generating...");
    //----------------------------------
  })
);

module.exports = router;

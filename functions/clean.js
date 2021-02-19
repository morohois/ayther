//i Das Modul Clean dient dazu, Veranstaltungen, die in der vergangenheit liegen aus der Datenbank zu entfernen. Clean läuft alle 24 Stunden ab

const { Veranstaltung } = require("../models/Veranstaltung"); //i Veranstaltungen importieren zum löschen
const { LocalTypGruppe } = require("../models/LocalTypGruppe"); //i Lokale TypGruppen importieren um den Veranstaltungsarray zu bereinigen

module.exports = async () => {
  let date = new Date(); //i Heutiges Datum
  let outDatedVeranstaltungen = await Veranstaltung.find({ zeitpunkt: { $lt: date } }); //i suchen nach Veranstaltungen deren Datum kleiner ist als das heutige Datum

  if (!outDatedVeranstaltungen) return; //i Wenn es keine gibt dann abbrechen

  for (i = 0; i < outDatedVeranstaltungen.length; i++) {
    const typgruppen = await LocalTypGruppe.find({ veranstaltungen: outDatedVeranstaltungen[i]._id }); //i Lokale Typgruppe ziehen, die die Veranstaltunge enthält
    typgruppen.splice(typgruppen.indexOf(outDatedVeranstaltungen[i]._id), 1); //i Veranstaltung aus dem Array entfernen
  }

  //++ Bereinigungsfunktion, wird für gewöhnlich nicht benötigt (Entfernt IDs aus den Typgruppen, die auf nicht existente Veranstaltungen verweisen)
  const typs = await LocalTypGruppe.find();

  for (a = 0; a < typs.length; a++) {
    //i alle Typgruppen durchlaufen
    for (b = 0; b < typs[a].veranstaltungen.length; b++) {
      //i alle veranstaltungen der Typgruppe durchlaufen

      //i Prüfen ob Veranstaltung existiert
      if (!(await Veranstaltung.findById(typs[a].veranstaltungen[b]))) {
        typs[a].veranstaltungen.splice(b, 1); //i entfernen der ID
        b--; //i wenn gelöscht eins zurück damit keins übersprungen wird
      }
    }
    if (!(await typs[a].save())) console.log("error"); //i sollte ein Fehler auftreten dann Loggen
  }

  return;
};

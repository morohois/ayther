const { Veranstaltung, validate } = require("../models/Veranstaltung");
const { LocalTypGruppe } = require("../models/LocalTypGruppe");
const { TypGruppe } = require("../models/Typgruppe");
const fetch = require("node-fetch");
const { Logger } = require("../logging/logger");

//++ Generiert Veranstaltungen alle 24 Stunden für jede Lokale Typ Gruppe
module.exports = async () => {
  console.log("Generating...");
  const datum = addDays(new Date(), 3); //i Datum in 3 Tagen finden
  //i Alle Gruppen ziehen
  const gruppen = await LocalTypGruppe.find(); //i alle Lokalen Typgruppen holen
  //i Für jede Gruppe eine Aktivität holen aus der AktiGen API
  await gruppen.forEach(async (gruppe) => {
    const refUser = (await TypGruppe.findById(gruppe.typgruppenID)).refUser; //i AktiGen referenzbenutzer bestimmen

    const aktivitaet = await getActivity(refUser, datum, gruppe.region.lat, gruppe.region.lon); //i siehe unten
    console.log(gruppe._id, aktivitaet.Activity == null); //i Debugging Log
    //i Wenn Aktivität gefunden dann ...
    if (aktivitaet.Activity) {
      const newVeranstaltung = new Veranstaltung({
        name: aktivitaet.Activity.name,
        zeitpunkt: datum,
      }); //i Neue Veranstaltung anlegen

      //i Wenn ein Ort für die Veranstaltung hinterlegt ist dann ...
      if (aktivitaet.Activity.location != null) {
        newVeranstaltung.set({
          ort: await getLocation(aktivitaet.Activity.location, `${gruppe.region.lat},${gruppe.region.lon}`),
        }); //i siehe unten
      }
      //i Speichern Veranstaltung
      const savedVeranstaltung = await newVeranstaltung.save();
      if (!savedVeranstaltung) Logger.error("Fehler beim Speichern der Veranstaltung");

      //i Speichern Gruppe
      gruppe.veranstaltungen.push(savedVeranstaltung._id); //i veranstaltungs ID der Gruppe hinzufügen
      await gruppe.save();
      if (!gruppe) Logger.error("Error saving Group!");
    }
  });
};

//++ Fügt einfach eine gewünschte Anzahl an Tagen zu dem Datum hinzu
function addDays(date, days) {
  const copy = new Date(Number(date));
  copy.setDate(date.getDate() + days);
  return copy;
}

//++ Führt einen Get Request auf die AktiGen API aus
async function getActivity(refUser, date, lat, lon) {
  const dateString = `${date.getDate()}.${("0" + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`; //i Probleme mit Date daher als String übergeben
  const aktiGenUrl = `https://safe-bastion-40322.herokuapp.com/suggestion?uid=${refUser}&lat=${lat}&lon=${lon}&date=${dateString}`;
  const aktivitaet = await (await fetch(aktiGenUrl)).json();
  return aktivitaet;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//++ Sucht mithilfe der Google Places API und der Foursquare API nach einem Passenden Ort
async function getLocation(ortString, latlon) {
  //i Secrets sind in der dotenv Datei zu funden
  const foursquareUrl = `https://api.foursquare.com/v2/venues/search?client_id=${process.env.FOURSQUARE_CLIENT}&client_secret=${process.env.FOURSQUARE_SECRET}&v=20300101&ll=${latlon}&intent=checkin&radius=10000&query=${ortString}`;
  const foursquareOrt = await (await fetch(foursquareUrl)).json();
  //i Secrets sind in der dotenv Datei zu funden
  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${ortString}&location=${latlon}&radius=10000&key=${process.env.PLACES_SECRET}`;
  const placesOrt = await (await fetch(placesUrl)).json();

  //i Veranstaltungsorte aus beiden Quellen zusammen fassen
  const veranstaltungsOrt = [];
  foursquareOrt.response.venues.forEach((e) => {
    veranstaltungsOrt.push({
      name: e.name,
      adresse: e.location.formattedAddress[0],
    });
  });
  placesOrt.results.forEach((e) => {
    veranstaltungsOrt.push({
      name: e.name,
      adresse: e.formatted_address,
    });
  });

  //i Einen zufälligen Ort zurückgeben aus den Ergebnissen
  return veranstaltungsOrt[getRandomInt(veranstaltungsOrt.length)];
}

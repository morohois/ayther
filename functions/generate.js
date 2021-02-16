const { Veranstaltung, validate } = require("../models/Veranstaltung");
const { LocalTypGruppe } = require("../models/LocalTypGruppe");
const { TypGruppe } = require("../models/Typgruppe");
const fetch = require("node-fetch");

module.exports = async () => {
  console.log("Generating...");
  const datum = addDays(new Date(), 3);
  //i Alle Gruppen ziehen
  const gruppen = await LocalTypGruppe.find();
  //i Für jede Gruppe eine Aktivität holen aus der AktiGen API
  await gruppen.forEach(async (gruppe) => {
    const refUser = (await TypGruppe.findById(gruppe.typgruppenID)).refUser;
    const aktivitaet = await getActivity(refUser, datum, gruppe.region.lat, gruppe.region.lon);
    const newVeranstaltung = new Veranstaltung({
      name: aktivitaet.Activity.name,
      zeitpunkt: datum,
    });
    if (aktivitaet.Activity.location != null) {
      newVeranstaltung.set({
        ort: await getLocation(aktivitaet.Activity.location, `${gruppe.region.lat},${gruppe.region.lon}`),
      });
    }
    const savedVeranstaltung = await newVeranstaltung.save();
    gruppe.veranstaltungen.push(savedVeranstaltung._id);
    await gruppe.save();

    console.log(gruppe);
  });
  //i Veranstaltung anreichern mit Ort aus Places oder Foursquare
};

function addDays(date, days) {
  const copy = new Date(Number(date));
  copy.setDate(date.getDate() + days);
  return copy;
}

async function getActivity(refUser, date, lat, lon) {
  const dateString = `${date.getDate()}.${("0" + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
  const aktiGenUrl = `https://safe-bastion-40322.herokuapp.com/suggestion?uid=${refUser}&lat=${lat}&lon=${lon}&date=${dateString}`;
  const aktivitaet = await (await fetch(aktiGenUrl)).json();
  return aktivitaet;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function getLocation(ortString, latlon) {
  const foursquareUrl = `https://api.foursquare.com/v2/venues/search?client_id=${process.env.FOURSQUARE_CLIENT}&client_secret=${process.env.FOURSQUARE_SECRET}&v=20300101&ll=${latlon}&intent=checkin&radius=10000&query=${ortString}`;
  const foursquareOrt = await (await fetch(foursquareUrl)).json();

  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${ortString}&location=${latlon}&radius=10000&key=${process.env.PLACES_SECRET}`;
  const placesOrt = await (await fetch(placesUrl)).json();
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

  return veranstaltungsOrt[getRandomInt(veranstaltungsOrt.length)];
}

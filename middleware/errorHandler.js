//++ Error Handler ist unserer Faulheit zu schulden und um redundanten Code zu vermeiden. errorHandler tut nichts weiter als
//++ um jede Funktion einen TryCatch Block zu setzen, damit dieser nicht jedes mal genannt werden muss. Der Try Catch Block ist
//++ wichtig, damit der Server nicht ausfällt!

const { Logger } = require("../logging/logger"); //i Logger für Konsole

exports.errorHandler = (handler) => {
  //i Eine Funktion zurückgeben die ...
  return async (req, res, next) => {
    try {
      await handler(req, res, next); //i die ursprüngliche Funktion enthält
    } catch (error) {
      Logger.error(`${error}`);
      res.status(500).json({ error: "Something went wrong!" });
      return; //i Bei Fehler die Anfrage abbrechen
    }
  };
};

//++ Auth dient dazu über einen Java Web Token zu erfahren ob ein Benutzer berechtigt ist bestimmte Änderungen zu machen
//++ Der WebToken enthält die ID des Benutzers und kann validiert werden. Sprich eine Manipulation ist nicht Möglich
//++ Auth dient als Middleware und kann vor alle kritischen Ressourcen geschrieben werden.
//i Auth ist nicht überall angewand, wo es hätte verwendet werden sollen, da es beim Testen ziemlich behindert.

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("x-auth-token"); //i Header Parameter x-auth-token prüfen
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." }); //i Kein Token keine weiterverarbeitung des Requests
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded; //i Erstellt einen weiteren reqest Parameter in dem die Dekodierte ID enthalten ist zum Abgleichen
    next(); //i Weiter machen mit der nächsten MiddleWare
  } catch (error) {
    return res.status(400).send("Invalid Token. -> " + error); //i Token Error ausgeben
  }
};

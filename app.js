//i Logging
const { Logger } = require("./logging/logger");
//i Express Modules
const express = require("express");
const cors = require("cors");
const app = express();
const { errorHandler } = require("./middleware/errorHandler");
const bodyParser = require("body-parser"); //Body Parser ermöglicht es mit Post Requests umzugehen
const generate = require("./functions/generate");

require("./startup/prod")(app);

require("dotenv").config();
const mongoose = require("mongoose");

/* ---------------------------------------
i ---------Connecting to Mongo DB---------
------------------------------------------*/
mongoose
  .connect(process.env.DB_LINK, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => Logger.success("Connection to DB established!"))
  .catch((error) => Logger.error(`Connection to DB failed: ${error}`));

/* ---------------------------------------
i ---------------MIDDLEWARES--------------
------------------------------------------*/
app.use(cors());
app.options("*", cors());

app.use(bodyParser.json()); //!!!!!! GANZ OBEN WEIL SONST KEIN REQ.BODY ANKOMMT (2 STUNDEN FEHLERSUCHE!!!!!!!!)
app.use((req, res, next) => {
  Logger.ipLog(`${req.method}: ${req.ip} | "${req.url}"`);
  next();
});

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const fragenRoute = require("./routes/fragen");
const localTypGruppenRoute = require("./routes/localTypGruppen");
const veranstaltungsRoute = require("./routes/veranstaltungen");

app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/fragen", fragenRoute);
app.use("/localTypGruppen", localTypGruppenRoute);
app.use("/veranstaltungen", veranstaltungsRoute);

/* ---------------------------------------
i --------------Daily Routine-------------
------------------------------------------*/
setInterval(() => {
  generate();
}, 86400000);
/* ---------------------------------------
i ----------Starting the Service----------
------------------------------------------*/
app.listen(process.env.PORT || 5000, () => Logger.info(`Server is listening on Port ${process.env.PORT}`));

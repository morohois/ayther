/*
i ------------------------------------------
i ----------ROUTING FILE (AUTH)------------
i ------------------------------------------
*/

//i importing the basic functionality of Routing via express
const express = require("express");
const { Logger } = require("../logging/logger");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { errorHandler } = require("../middleware/errorHandler");
const mask = require("json-mask");

//i importing the DB-models needed
const { User, validateLogin } = require("../models/User");

//i Register User
router.post(
  "/",
  errorHandler(async (req, res) => {
    req.body = mask(req.body, "username,password");
    const { error } = await validateLogin(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const user = await User.findOne({ username: req.body.username });
    if (!user)
      return res.status(400).json({
        error: `Invalid Username or password!`,
      });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(400).json({
        error: `Invalid Username or password!`,
      });
    const token = user.generateAuthToken();
    res.send(token);
  })
);
module.exports = router;

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
const { User, validate } = require("../models/User");

//i Register User
router.post(
  "/",
  errorHandler(async (req, res) => {
    console.log(req.body);
    req.body = mask(req.body, "username,email,password");
    const { error } = await validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    if (await User.exists({ username: req.body.username }))
      return res.status(400).json({
        error: `User with name ${req.body.username} already exists!`,
      });

    newUser = new User(_.pick(req.body, ["username", "email", "password"]));

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    const savedUser = await newUser.save();
    if (savedUser == null) return res.status(500).json({ error: "User couldn't be saved! Please try again!" });

    const token = savedUser.generateAuthToken();
    res.header("x-auth-token", token).send(_.pick(savedUser, ["_id", "username", "email"]));
  })
);

router.get("/", async (req, res) => {
  const users = await User.find().select({ username: 1 });
  res.json(users);
});

router.delete("/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(await User.exists({ _id: req.user._id }))) return res.status(410).send("User could not longer be found!");
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized");

    const deletedUser = await User.findByIdAndDelete({ _id: req.user._id });

    if (!deletedUser) return res.status(500).send("Something went wrong, please try again later!");

    res.status(200).send(`User ${deletedUser.username} was deleted!`);
  }),
]);

router.get(
  "/:id",
  errorHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(401).send("User could not be found!");
    res.send(_.pick(user, ["username"]));
  })
);

router.get("/private/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized");

    const user = await User.findById(req.user._id);
    res.send(_.pick(user, ["_id", "username", "email"]));
  }),
]);

router.put("/:id", [
  auth,
  errorHandler(async (req, res) => {
    if (!(req.user._id == req.params.id)) return res.status(401).send("unauthorized");

    const user = await User.findById(req.user._id);

    user = req.body;

    const savedUser = await user.save();

    res.send(_.pick(savedUser, ["_id", "username", "email"]));
  }),
]);

module.exports = router;

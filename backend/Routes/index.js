const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application");
const auth = require("./auth");
const subscription = require("./subscription");
const resume = require("./resume");
const post = require("./post");
const friend = require("./friend");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/auth", auth);
router.use("/subscription", subscription);
router.use("/resume", resume);
router.use("/post", post);
router.use("/friend", friend);

module.exports = router;
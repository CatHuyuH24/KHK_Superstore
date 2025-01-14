const router = require("express").Router();
const aboutUsController = require("./aboutUsController");

router.get("/",aboutUsController.renderAboutUsPage);

module.exports = router;
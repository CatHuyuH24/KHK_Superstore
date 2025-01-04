const router = require("express").Router();
const registerController = require("./registrationController");

router.post("/", registerController.handleRegisterRequest);
router.get("/",registerController.renderRegistrationPage);
router.get("/verify/:userId/:uniqueString",registerController.renderVerify)
module.exports = router;
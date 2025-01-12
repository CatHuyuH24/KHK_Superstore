const router = require("express").Router();
const resetPassController = require("./resetPassController");

router.post("/emailIndentify", resetPassController.handleResetPassRequest);
router.get("/emailIndentify",resetPassController.renderEmailIdentifyPage);
router.get("/forgotPassPage",resetPassController.renderResetPassPage);
router.post("/forgotPassPage",resetPassController.changeNewPassword);
module.exports = router;
const express = require('express');
const router = express.Router();
const checkoutController = require("./checkoutController");
const utils = require("../Utils/jwtUtils")

// Route to render the checkout page
router.get('/',utils.authMiddleware({ session: true }) ,checkoutController.renderCheckoutPage)

module.exports = router;
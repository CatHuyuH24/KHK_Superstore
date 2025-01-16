const express = require("express");
const router = express.Router();
const categoryController = require("./categoryController"); // Ensure this path is correct

const televisionRouter = require("../television/televisionRouter");
const mobilephoneRouter = require("../mobilephone/mobilephoneRouter");
const computerRouter = require("../computer/computerRouter");
const redisClient = require("../../config/redisClient");
function redisCache(req, res, next) {
  const key = req.originalUrl;
  redisClient.get(key, (err, data) => {
    if (err) throw err;
    if (data) {
      return res.send(data);
    } else {
      next();
    }
  });
}
router.get("/", redisCache, categoryController.renderCategoryPage);

router.use("/computers", computerRouter);
router.use("/mobilephones", mobilephoneRouter);
router.use("/televisions", televisionRouter);

module.exports = router;

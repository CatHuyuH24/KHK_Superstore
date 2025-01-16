const router = require("express").Router();
const televisionController = require("./televisionController");
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
router.get("/", televisionController.renderTelevisionCategoryPage);
router.get("/:id", televisionController.renderTelevisionDetailPage);

module.exports = router;

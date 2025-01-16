const router = require("express").Router();
const mobilephoneController = require("./mobilephoneController");
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

router.get("/", redisCache, mobilephoneController.renderMobilephoneCategoryPage);
router.get("/:id", redisCache, mobilephoneController.renderMobilephoneDetailPage);

module.exports = router;



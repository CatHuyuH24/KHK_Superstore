const router = require("express").Router();
const computerController = require("./computerController");
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

router.get("/", redisCache,  computerController.renderComputerCategoryPage);
router.get("/:id", redisCache, computerController.renderComputerDetailPage);

module.exports = router;


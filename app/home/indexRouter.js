const router = require("express").Router();
const indexController = require("../home/indexController");
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

router.get("/", redisCache, indexController.renderHomePage);

module.exports = router;

const {StatusCodes} = require('http-status-codes');
const router = require('express').Router();
const redisClient = require("../../config/redisClient");
router.get("/", (req, res)=>{
    res.send("Cache API is working");
})
router.delete("/", async (req, res) => {
    const key = req.query.key;
    if (!key) {
        console.log('Key is required');
        return res.status(StatusCodes.BAD_REQUEST).send({ message: "Key is required" });
    }

    try {
        if(key == 'all'){
            await redisClient.flushall();
            res.status(StatusCodes.OK).send({ message: "All cache deleted successfully" });
        } else {
            const valueDeleted = await redisClient.del(key);
            if(valueDeleted == 1){
                res.send({ message: "Cache deleted successfully" });
            } else {
                res.status(StatusCodes.NOT_FOUND).send({ message: "Cache not found" });
            }
        }        
    } catch (error) {
        console.error("Error resetting cache:", error);
        res.status(500).send({ message: "Error resetting cache" });
    }
});

module.exports = router;
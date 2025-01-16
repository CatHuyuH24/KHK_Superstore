require('dotenv').config();
const redis = require('ioredis');
let redisClient = new redis(
    process.env.REDIS_URL
);

redisClient.on('error', (err)=>{
    console.error('Redis Client error: ', err);
});

redisClient.on('connect', ()=>{
    console.log('Connected to Redis');
});

module.exports = redisClient;
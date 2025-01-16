const redisClient = require('../../config/redisClient');
async function renderAboutUsPage(req, res) {
    try {
        const key = req.originalUrl;
        res.render('aboutUS', {}, async (err, html) => {
            if (err) {
                console.error('Error rendering about us page:', err);
                res.status(500).send('Internal server error');
            } else {
                // Cache the rendered HTML for 1 hour
                redisClient.setex(key, 3600, html);
                res.send(html);
            }
        });
    } catch (error) {
        console.error('Error handler about us:', error);
    }
}

module.exports = {
    renderAboutUsPage,
};
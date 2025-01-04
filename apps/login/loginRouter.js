const router = require("express").Router();
const passport = require("passport");
const loginController = require("./loginController");


require('./passport.js');
router.post('/', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (!user) {
            return res.status(401).json({
                message: info.message || 'Authentication failed',
                title: info.title || 'Login Error',
            });
        }
        req.login(user, (loginErr) => {
            if (loginErr) {
                return res.status(500).json({ message: 'Login Error' });
            }
            return res.status(200).json({
                message: 'Login successful',
                redirectTo: '/'  // Thêm thông tin chuyển hướng
            });
        });
    })(req, res, next);
});

router.get('/federated/facebook', passport.authenticate('facebook'));
router.get('/oauth2/redirect/facebook', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get("/",loginController.renderLoginPage);

module.exports = router;
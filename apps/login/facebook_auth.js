const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const loginService = require('./loginService');

passport.use(new FacebookStrategy({
    clientID: process.env['FACEBOOK_CLIENT_ID'],
    clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
    callbackURL: '/login/oauth2/redirect/facebook',
    state: true,
}, async function verify(accessToken, refreshToken, profile, cb) {
    try {
        let federatedCredentials = await loginService.findFederatedCredentials('https://www.facebook.com', profile.id);
        if (!federatedCredentials) {
            const userId = await loginService.createUser(
                profile.displayName, // real_name
                '', // username
                profile.emails ? profile.emails[0].value : '',// email (nếu có thể lấy từ profile)
                '', // hashed_password
                '', // salt
                'user', // role
                '' // avatar_img_url (nếu có thể lấy từ profile)
            );

            await loginService.createFederatedCredentials(userId, 'https://www.facebook.com', profile.id);

          
            return cb(null, { id: userId, name: profile.displayName });
        } else {
           
            const user = await loginService.findUserById(federatedCredentials.user_id);
            if (!user) {
                return cb(null, false); 
            }

            return cb(null, user); 
        }
    } catch (error) {
        console.error('Error during Facebook authentication', error);
        return cb(error, null);
    }
}));

passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser(async(userId,done)=>{
    try{
        const user=await loginService.findUserById(userId);
        if(user){
            return done(null,user)
        }
    }catch(err){
        done(err);
    }
})
// app/profile/profileController.js
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const profileService = require('./profileService');
const pool = require('../../config/database');

async function renderProfilePage(req, res) {
    try {
        const userID = res.locals.user ? res.locals.user.id : null;
        if (!userID) {
            return res.redirect('/login');
        }
        const user = await profileService.getUserById(userID);
        const avatarUrl = user.avatar_img_url;
        res.render('profile', { title: 'Profile - Superstore', user_id: userID, avatarUrl });
    } catch (error) {
        console.error('Error rendering profile page:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
}

async function updateProfile(req, res) {
    try {
        const userID = res.locals.user ? res.locals.user.id : null;
        if (!userID) {
            return res.redirect('/login');
        }
        const { name, email, phone } = req.body;

        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).send('Invalid phone number.\nThe phone number must start with 0 and have the length of 10.');
        }

        const user = await profileService.getUserById(userID);

        if (user.email !== email) {
            await profileService.sendVerificationEmail(userID, email);
            return res.status(StatusCodes.OK).send('Verification email sent. Please verify your new email address.');
        }

        await profileService.updateUserProfile(userID, name, email, phone);
        res.redirect('/profile?success=1');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
}

async function verifyEmail(req, res) {
    try {
        const { token } = req.query;
        const result = await pool.query(
            "SELECT user_id, email FROM email_verifications WHERE token = $1",
            [token]
        );
        if (result.rows.length > 0) {
            const { user_id, email } = result.rows[0];
            await profileService.updateUserEmail(user_id, email);
            await pool.query(
                "DELETE FROM email_verifications WHERE token = $1",
                [token]
            );
            res.redirect('/profile');
        } else {
            res.status(StatusCodes.BAD_REQUEST).send('Invalid or expired token.');
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
}

async function changePassword(req, res) {
    try {
        const userID = res.locals.user ? res.locals.user.id : null;
        if (!userID) {
            return res.redirect('/login');
        }
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        // Check if the new password meets the requirements
        const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            const message = "Password must be at least 8 characters long and include at least one number, one uppercase letter, one lowercase letter, and one special character.";
            return res.render('changePassword', { title: 'Change Password', message, user_id: userID });
        }

        if (newPassword !== confirmNewPassword) {
            message = "Confirm passwords do not match";
            return res.render('changePassword', { title: 'Change Password', message, user_id: userID });
        }
        const user = await profileService.getUserById(userID);

        const isPasswordValid = await profileService.verifyPassword(userID, currentPassword);
        if (!isPasswordValid) {
            message = "Current passwords is incorrect";
            return res.render('changePassword', { title: 'Change Password', message, user_id: userID });
        }

        await profileService.updateUserPassword(userID, newPassword);
        isSuccess = true;
        return res.render('changePassword', {title: 'Change Password', message: 'Password changed successfully', user_id: userID });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
}

async function uploadAvatar(req, res) {
    try {
        const userId = res.locals.user ? res.locals.user.id : null;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).send('Unauthorized');
        }
        const filePath = req.file.path;

        const imageUrl = await profileService.uploadAvatar(userId, filePath);

        res.json({ imageUrl });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to upload avatar' });
    }
}

module.exports = {
    renderProfilePage,
    updateProfile,
    verifyEmail,
    changePassword,
    uploadAvatar,
};

const registrationService = require('./registrationService');
const userVerificationService=require('../userVerification/userVerificationService')
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
var crypto = require('crypto');
const genPassword = require('../Utils/passwordUtils').genPassword;
const genUniqueString = require('../Utils/passwordUtils').genUniqueString;
const validUniqueString = require('../Utils/passwordUtils').validUniqueString;
const nodemailer=require("nodemailer");
const {v4: uuidv4}=require("uuid");

require("dotenv").config();

let transporter=nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})

const title = "Register - Superstore - GA05";

async function handleRegisterRequest(req, res) {
    try {
        const { name, email, password, passwordConfirm, agree } = req.body;

        if (!agree) {
            message = "You need to agree to the Terms and Conditions.";
            message = "You need to agree to the Terms and Conditions.";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register", { message, title });
        }

        if (password !== passwordConfirm) {
            message = "Passwords do not match.";
            message = "Passwords do not match.";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register", { message, title });
        }

        const userCheck = await registrationService.findUserByEmail(email);
        if (userCheck) {
            message = "This email is already registered. Please use a different email.";
            message = "This email is already registered. Please use a different email.";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register", { message, title });
        }
        
        message=validatePassword(password);
        if(message!="Password is valid."){
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register",{message,title});
        }

        try {
            const genPass = await genPassword(password);
            try {
                const newUser = await registrationService.createUser(name, email, genPass.hashedPassword, genPass.salt);
                sendVerificationEmail(newUser, res);
                message="Registration successful! Please check your email to verify your account."
                if (req.xhr) {
                    return res.json({ message, title });
                }
                console.log("Register Successfull");
            } catch (error) {
                console.error("Error creating user:", error);
                res.status(500).send("Error registering user.");
            }
        } catch (error) {
            if (error.message.includes('crypto')) {
                console.error('Error generating password:', error);
                message = 'Có lỗi khi tạo mật khẩu. Vui lòng thử lại.';
                return res.render('register', { message, title });
            }
            console.error('Error handler register:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
            );
        }

    } catch (error) {
        console.error('Error handler register:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
    }
}

async function renderRegistrationPage(req, res) {
    try {
        message = "";
        if (req.xhr) {
            return res.json({ message, title });
        }
        res.render('register', {  title });
    } catch (error) {
        console.error('Error handler register:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
    }
}

async function renderVerify(req, res) {
    const { userId, uniqueString } = req.params;
    const login_title = "Login - Supershop - GA05";

    try {
        const userVerification = await userVerificationService.findUserVerificationById(userId);
        if (!userVerification) {
            const message = "Account record doesn't exist or has been verified already. Please sign up or log in.";
            return res.render("login", { message, title:login_title });
        }

        // Check if the verification link has expired
        if (userVerification.expires_at < Date.now()) {
            try {
                await userVerificationService.deleteUserVerificationByUserId(userId);
                await registrationService.deleteUserById(userId);
                const message = "Link has expired. Please sign up again.";
                return res.render("register", { message, title: "Register - Supershop - GA05" });
            } catch (error) {
                console.error("Error handling expired verification link:", error);
                return res.status(500).send("Internal Server Error.");
            }
        }

        // Validate unique string
        const isValid = await validUniqueString(uniqueString, userVerification.uniquestring, userVerification.salt);
        if (!isValid) {
            const message = "Invalid verification details passed. Check your email.";
            return res.render("login", { message, title:login_title });
        }

        // Mark user as verified
        try {
            await registrationService.updateUserVerifyById(userId);
            await userVerificationService.deleteUserVerificationByUserId(userId);
            const message = "Account successfully verified. You can now log in.";
            return res.render("login", { message, title:login_title });
        } catch (error) {
            console.error("Error verifying user account:", error);
            return res.status(500).send("Internal Server Error.");
        }
    } catch (error) {
        console.error("Error finding user verification record:", error);
        return res.status(500).send("Internal Server Error.");
    }
}

const sendVerificationEmail =async ({id,email},res)=>{
   
    const currentUrl=" https://khk-superstore-yart.onrender.com/";
    const uniqueString=uuidv4()+ id;
    const mailOptions={
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to complete the signup and login into your account.</p>
            <p>
            This link 
            <b>expries in 1 minute</b>.</p>
            <b>expries in 1 minute</b>.</p>
            <p>Press <a href=${currentUrl+"register/verify/"+id+"/"+uniqueString}>here</a>
            to process.</p>`,
    }

    try {
        const genUSqtring=await genUniqueString(uniqueString);
        try {
            await userVerificationService.createUserVerification(id,genUSqtring.hashedUniqueString,genUSqtring.salt);

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Error creating userVerification:", error);
            res.status(500).send("Error registering user.");
        }
    } catch (error) {
        if (error.message.includes('crypto')) {
            console.error('Error generating password:', error);
            message = 'Có lỗi khi tạo mật khẩu. Vui lòng thử lại.';
            return res.render('register', { message, title });
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
    }

}


function validatePassword(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return "Password must be at least 8 characters long.";
    }
    if (!hasUppercase || !hasLowercase) {
        return "Password must contain both uppercase and lowercase letters.";
    }
    if (!hasNumber) {
        return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
        return "Password must contain at least one special character.";
    }
    return "Password is valid.";
}




module.exports = {
    handleRegisterRequest,
    renderRegistrationPage,
    renderVerify
};

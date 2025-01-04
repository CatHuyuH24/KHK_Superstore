const resetPassService = require('./resetPassService');
const userVerificationService=require('../userVerification/userVerificationService')
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
var crypto = require('crypto');
const genPassword = require('../Utils/passwordUtils').genPassword;
const genUniqueString = require('../Utils/passwordUtils').genUniqueString;
const validUniqueString = require('../Utils/passwordUtils').validUniqueString;
const validatePassword=require('../Utils/checkValidPassWord').validatePassword;
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
            message = "Bạn cần đồng ý với các Điều khoản và Điều kiện.";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register", { message, title });
        }
    
        if (password !== passwordConfirm) {
            message = "Mật khẩu không khớp.";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("register", { message, title });
        }
        
        const userCheck = await resetPassService.findUserByEmail(email);
        if (userCheck) {
            message = "Email này đã được đăng ký. Vui lòng sử dụng email khác.";
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
                const newUser = await resetPassService.createUser(name, email, genPass.hashedPassword, genPass.salt);
                sendVerificationEmail(newUser, res);
                message="resetPass successful! Please check your email to verify your account."
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

async function renderresetPassPage(req, res) {
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
                await resetPassService.deleteUserById(userId);
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
            await resetPassService.updateUserVerifyById(userId);
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
    const currentUrl="http://localhost:3000/";
    const uniqueString=uuidv4()+ id;
    const mailOptions={
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to complete the signup and login into your account.</p>
            <p>
            This link 
            <b>expries in 6 hours</b>.</p>
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


module.exports = {
    handleRegisterRequest,
    renderresetPassPage,
    renderVerify
};
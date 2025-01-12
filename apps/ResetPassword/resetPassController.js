const resetPAssService = require('./resetPassService');
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

const title = "Login - Superstore - GA05";


async function handleResetPassRequest(req, res) {
    
        const {email} = req.body;
   
        const userCheck = await resetPAssService.findUserByEmail(email);
        if (!userCheck) {
            message = "Can not find email like that!";
            if (req.xhr) {
                return res.json({ message, title });
            }
            return res.render("emailIdentifier", { message, title });
        }

        
        try {
            sendVerificationEmail(userCheck, res);
            message="Check email to reset password";
            return res.render('resetPassNoti',{email});
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send("Error registering user.");
        }
  
}

async function renderEmailIdentifyPage(req, res) {
    try {
        message = "";
        if (req.xhr) {
            return res.json({ message });
        }
        res.render('emailIdentifier');
    } catch (error) {
        console.error('Error handler email identif:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
    }
}

async function renderResetPassPage(req, res) {
    const email = req.query.email; 
    const uniqueString=req.query.code;
    return res.render('forgotPassPage', {email,uniqueString});
}

async function changeNewPassword(req,res){
    try{

        const email = req.body.email;
        const uniqueString = req.body.uniqueString;
        console.log(email,uniqueString);
        const message="Some error occur.";
        const user=await resetPAssService.findUserByEmail(email);
    
        if(!user.resetpassworduniquestring || user.resetpassworduniquestring!==uniqueString){
           return res.render('forgotPassPage',{email,message,uniqueString});
        }
        const {password} = req.body;
        const genPass = await genPassword(password);

        await resetPAssService.resetPassWord(email,genPass.hashedPassword, genPass.salt);
        await resetPAssService.updateResetPasswordUniqueString(email,null,null);
        return res.render('resetPassSuccess',{email});

    }catch(error){
        console.error("Error change pass for user:", error);
        res.status(500).send("Error change pass for user.");
    }
}
const sendVerificationEmail =async ({id,email,real_name},res)=>{
    const currentUrl="http://localhost:3000/";
    const uniqueString=uuidv4()+ id;
    const mailOptions={
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Reset Password",
        html: `  <p>Hello ${real_name},</p>
            <p>We received a request to reset the password for your KHK-Shop account.</p>
            <p>Click <a href="${currentUrl}resetPass/forgotPassPage?code=${uniqueString}&email=${encodeURIComponent(email)}">here</a> to set a new password for your HKH account.</p>
            <p>Or copy and paste the following link into your browser:</p>
        <p><a href="${currentUrl}resetPass/forgotPassPage?code=${uniqueString}&email=${encodeURIComponent(email)}">${currentUrl}forgot_password/?code=${uniqueString}&email=${encodeURIComponent(email)}</a></p>
        <p>Best regards,</p>`,
    }

    try {
        try {
            const expireTime = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
            await resetPAssService.updateResetPasswordUniqueString(email,expireTime,uniqueString);
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Error creating userVerification:", error);
            res.status(500).send("Error registering user.");
        }
    } catch (error) {
        if (error.message.includes('crypto')) {
            console.error('Error generating password:', error);
            message = 'Có lỗi khi tạo lại mật khẩu. Vui lòng thử lại.';
            return res.render('emailIdentifier', { message, title });
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
    }
   
}


module.exports = {
    handleResetPassRequest,
    renderEmailIdentifyPage,
    renderResetPassPage,
    changeNewPassword
};
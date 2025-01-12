const pool = require('../../config/database');

async function findUserByEmail(email) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null; 
    } catch (error) {
        console.error('Error fetching user by email', error);
        return null; 
    }
}

async function updateResetPasswordUniqueString(email,expires,uniqueString){
    try{
        await pool.query("UPDATE users SET resetpassworduniquestring=$1, resetpasswordexpires=$2 WHERE email = $3",
             [uniqueString,expires,email]);
        return null;
    }catch(error){
        console.error('Error updating user uniqueString by email', error);
        return null; 
    }
}

async function resetPassWord(email, newPassword,salt){
    try{
        
        await pool.query("UPDATE users SET hashed_password = $1, salt=$2 WHERE email = $3", [newPassword,salt,email]);
        return null;
    }catch (error) {
        console.error('Error update new password'.error);
        return null;
    }
}


module.exports = {
    findUserByEmail,
    resetPassWord,
    updateResetPasswordUniqueString,

}
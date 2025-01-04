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

async function findUserById(id) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null; 
    } catch (error) {
        console.error('Error fetching user by id', error);
        return null; 
    }
}

async function createUser(name,email,hashedPassword,salt) {
    try {  
        const query = `
        INSERT INTO users (real_name, username, email, hashed_password, salt, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;  
	    
        const values = [name,email,email, hashedPassword, salt,"customer"];
        
        const result = await pool.query(query, values);
        return result.rows[0];
        
    } catch (error) {
        console.error('Error create user', error);
    }
}

async function deleteUserById(id){
    try {
        await pool.query("Delete FROM users WHERE id = $1", [id]);
        return null;
    } catch (error) {
        console.error('Error delete user by id', error);
        return { success: false, message: "Error occurred during deletion" };
    }
}

async function updateUserVerifyById(id){
    try{
        await pool.query("UPDATE users SET verified = true WHERE id = $1", [id]);
        return null;
    }catch(error){
        console.error('Error update user verify by id', error);
        return { success: false, message: "Error occurred during update" };
    }
}
module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    deleteUserById,
    updateUserVerifyById,
}
    
const pool = require('../../config/database');

async function findUserVerificationById(id) {
    try {
        const result = await pool.query("SELECT * FROM userverification WHERE user_id = $1", [id]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null; 
    } catch (error) {
        console.error('Error fetching userVerification by id', error);
        return null; 
    }
}

async function createUserVerification(id,uniqueString,salt){
    try {  
        const query ="INSERT INTO userverification (user_id,uniquestring,salt) VALUES ($1, $2,$3)";
	    
        const values = [id,uniqueString,salt];
        
        await pool.query(query, values);     
        
    } catch (error) {
        console.error('Error create userverification', error);
    }
}

async function deleteUserVerificationByUserId(id){
    try {
        await pool.query("Delete FROM userverification WHERE user_id = $1", [id]);
        return null;
    } catch (error) {
        console.error('Error delete userVerification by id', error);
        return { success: false, message: "Error occurred during deletion" };
    }
}


module.exports = {
    createUserVerification,
    findUserVerificationById,
    deleteUserVerificationByUserId
}
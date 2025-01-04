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

async function findFederatedCredentials(provider, subject) {
    try {
        const result = await pool.query(
            "SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2",
            [provider, subject]
        );
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching federated credentials', error);
        return null;
    }
}

async function createUser(realName, username, email, hashedPassword, salt, role, avatarImgUrl) {
    try {
        const result = await pool.query(
            "INSERT INTO users (real_name, username, email, hashed_password, salt, role, avatar_img_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [realName, username, email, hashedPassword, salt, role, avatarImgUrl]
        );
        return result.rows[0].id; // Trả về ID người dùng mới
    } catch (error) {
        console.error('Error creating user', error);
        return null;
    }
}

async function createFederatedCredentials(userId, provider, subject) {
    try {
        const result = await pool.query(
            "INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3) RETURNING id",
            [userId, provider, subject]
        );
        return result.rows[0].id; // Trả về ID của thông tin xác thực
    } catch (error) {
        console.error('Error creating federated credentials', error);
        return null;
    }
}



module.exports = {
    findUserByEmail,
    findUserById,
    findFederatedCredentials,
    createUser,
    createFederatedCredentials,
}
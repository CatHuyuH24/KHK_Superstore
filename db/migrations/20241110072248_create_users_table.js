/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {

  await knex.raw(
    `CREATE SEQUENCE IF NOT EXISTS users_id_seq START WITH 3;`
  );


  await knex.raw(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER DEFAULT nextval('users_id_seq') PRIMARY KEY,
      real_name VARCHAR(255),
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      hashed_password VARCHAR(255) NOT NULL,
      salt VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      avatar_img_url VARCHAR,
      verified BOOLEAN DEFAULT FALSE,
      resetpassworduniquestring varchar(200) default null,
      resetPasswordExpires TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      fullname VARCHAR(255), 
      phone_number VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  );
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS users;`);
  // Xóa sequence nếu cần
  await knex.raw(`DROP SEQUENCE IF EXISTS users_id_seq;`);
};

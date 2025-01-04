/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(
    `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    real_name VARCHAR(255),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    avatar_img_url VARCHAR,
    verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);`
  );
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS users;`);
};

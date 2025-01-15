/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS userVerification (
        user_id SERIAL PRIMARY KEY,
        uniqueString VARCHAR(255),
        salt VARCHAR(255) NOT NULL,
        create_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '60 seconds',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  };
  
  exports.down = async function (knex) {
    await knex.raw(`DROP TABLE IF EXISTS userVerification;`);
  };
  
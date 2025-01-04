/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw(
      `CREATE TABLE IF NOT EXISTS federated_credentials (
    id SERIAL PRIMARY KEY, 
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    UNIQUE(provider, subject)
);`
    );
  };
  
  exports.down = async function (knex) {
    await knex.raw(`DROP TABLE IF EXISTS federated_credentials;`);
  };
  
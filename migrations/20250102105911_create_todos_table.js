/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw(
      `CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE
);`
    );
  };
  
  exports.down = async function (knex) {
    await knex.raw(`DROP TABLE IF EXISTS todos;`);
  };
  
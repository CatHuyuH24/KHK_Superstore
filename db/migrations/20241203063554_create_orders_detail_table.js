/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS orders_detail (
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price decimal(20 ,2) ,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        PRIMARY KEY (order_id, product_id)
    );`);

    await knex.raw(`
      CREATE SEQUENCE IF NOT EXISTS order_code_seq  START 1;
    `);
  
    await knex.raw(`
      CREATE OR REPLACE FUNCTION generate_order_code()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.order_code := 'DH' || LPAD(nextval('order_code_seq')::TEXT, 3, '0');
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  
    await knex.raw(`
      CREATE TRIGGER trg_generate_order_code
      BEFORE INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION generate_order_code();
    `);

  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    await knex.raw(`DROP TABLE IF EXISTS orders_detail;`);
    await knex.raw(`DROP TRIGGER IF EXISTS trg_generate_order_code ON orders`);
    await knex.raw(`DROP FUNCTION IF EXISTS generate_order_code`);
  
    await knex.raw(`DROP SEQUENCE IF EXISTS order_code_seq`);
  };
  
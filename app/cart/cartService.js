
const pool = require('../../config/database');



const addToCart = async (user_id, product_id, quantity, price) => {
    try {
        const query = `
        INSERT INTO carts (user_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, product_id) 
        DO UPDATE SET quantity = carts.quantity + $3, price = $4
        RETURNING *;
        `;
        const values = [user_id, product_id, quantity, price];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch {
        console.error('Error adding product to cart:', error.message);
        throw error;
    }
    
}

const getProductInCartByUserId = async(user_id)=>{
    try {
        const result=await pool.query(`
        SELECT p.image_url, c.quantity, c.price,
        c.quantity * p.price AS total, p.name,
        p.price*p.discount/100 AS discount_price, p.id, p.number
        FROM carts c
        JOIN products p ON c.product_id=p.id
        WHERE c.user_id=$1
        `,[user_id])
        const totalSum = result.rows.reduce((sum, row) => sum + row.total, 0);
        const totalDiscount=result.rows.reduce((sum, row) => sum+ row.discount_price, 0);
        return {
            products: result.rows,
            totalSum: parseFloat(totalSum.toFixed(2)),
            totalDiscount: parseFloat(totalDiscount.toFixed(2)),
            totalPay: parseFloat((totalSum-totalDiscount).toFixed(2))
        };
    }catch(error){
        console.error('Error fetching product in cart by user id', error);
        return { products: [], totalSum: 0, totalDiscount: 0 };
    }
}

async function updateQuantityInCart(product_id, user_id, new_quantity){

  const checkQuery = 'SELECT quantity FROM carts WHERE product_id = $1 AND user_id = $2';
  const checkResult = await pool.query(checkQuery, [product_id, user_id]);

  if (checkResult.rows.length === 0) {
    throw new Error('Product not found in cart');
  }

  const oldQuantity = checkResult.rows[0].quantity;

  const query = `UPDATE carts SET quantity = $1 WHERE product_id = $2 AND user_id = $3`;

  const values = [new_quantity, product_id, user_id];

  await pool.query(query, values);

  //update quantity products table 
  // if(oldQuantity < new_quantity)
  // {
  //   await pool.query(`UPDATE products SET number = number - $1 WHERE id = $2`, [(new_quantity - oldQuantity), product_id]);
  // }
  // if(oldQuantity > new_quantity)
  // {
  //   await pool.query(`UPDATE products SET number = number + $1 WHERE id = $2`, [(oldQuantity - new_quantity), product_id]);
  // }

  return new_quantity;
  
}

async function deleteProductInCart(product_id, user_id) {
  try {
    const checkQuery = 'SELECT quantity FROM carts WHERE product_id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [product_id, user_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('Product not found in cart');
    }

    const query = `DELETE FROM carts WHERE product_id = $1 AND user_id = $2`;
    await pool.query(query, [product_id, user_id]);

    //update products table
    // await pool.query(`UPDATE products SET number = number + $1 WHERE id = $2`, [checkResult.rows[0].quantity, product_id]);
    return true;
  } catch (error) {
    console.error('Error deleting product in cart:', error);
    throw error;
  }
  
}

module.exports ={
    addToCart,
    getProductInCartByUserId,
    updateQuantityInCart,
    deleteProductInCart
}
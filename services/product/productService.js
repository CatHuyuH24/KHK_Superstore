const pool = require('../../config/database');
const { prepareFilterStatements } = require('../../app/Utils/filterStatementUtils');

/**
 * Get all products of a specific category with filters applied and the total number of products.
 * Each record in the 'products' array contains the following fields:
 * - id
 * - name
 * - manufacturer
 * - price
 * - imageurl
 * - detail
 * - discount
 * - number (number of products in stock)
 * - category_name
 * - reviewer_count (number of unique users who rated the product)
 * - review_average (average rating of the product)
 * - total_count (total number of products matching the filters)
 * - created_at
 *
 * @param {number} minPrice - Minimum price filter.
 * @param {number} maxPrice - Maximum price filter.
 * @param {number} page - Page number for pagination, expected to be greater than 0.
 * @param {number} limit - Number of items per page.
 * @param {string} sort - Sort order (column, direction). e.g. "id,ASC". If not provided, by default is ascending order by id.
 * @param {string} manufacturer - Manufacturer filter. e.g ["Apple", "Samsung",...].
 * @param {string} search - Search keyword.
 * @param {string} products_category - Category of products. e.g. "computers". If not provided, all products will be fetched.
 * @param {string} startDate - Start date filter.
 * @param {string} endDate - End date filter.
 * @param {number} fps - frame fresh rate filter.
 * @returns {Promise<Object>} An object containing the total count of products and the array of products.
 * @returns {number} return.totalCount - Total number of products matching the filters.
 * @returns {Array} return.products - Array of products.
 * @example
 * const {totalCount, products} = await getAllProductsOfCategoriesWithFilterAndCount(0, 1000, 1, 10, "price,ASC", "Apple", "macbook", "computers");
 */
async function getAllProductsOfCategoriesWithFilterAndCount(
  minPrice,
  maxPrice,
  page,
  limit,
  sort,
  manufacturer,
  search,
  products_category,
  startDate,
  endDate,
  fps,
) {
  try {
  const {
    priceFilter, 
    manufacturerFilter, 
    dateFilter,
    searchFilter, 
    productsCategoryFilter,
    fpsFilter,
  } = prepareFilterStatements(
    minPrice, maxPrice, sort, manufacturer, 
    search, products_category, startDate, endDate, fps,
  );

  let sortFilter = "";
  const [sortColumn, sortDir] = sort.split(",");
  if(sortColumn != null && sortDir != null) {
      sortFilter = `ORDER BY ${sortColumn} ${sortDir}`;
  } else {
      sortFilter = "ORDER BY p.id ASC";
  }

    const result = await pool.query(
      `
            SELECT 
                p.id, 
                p.name, 
                p.image_url, 
                p.number, 
                p.price, 
                p.discount, 
                p.status,
                m.manufacturer_name, 
                c.category_name, 
                COUNT(DISTINCT r.user_id) AS reviewer_count,
                AVG(r.rating) AS review_average,             
                COUNT(*) OVER() AS total_count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN manufacturers m ON p.manufacturer_id = m.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE 1=1
            ${productsCategoryFilter}
            ${manufacturerFilter}
            ${searchFilter}
            ${priceFilter}
            ${dateFilter}
            ${fpsFilter}
            GROUP BY 
                p.id, 
                p.name, 
                p.image_url, 
                p.number, 
                p.price, 
                p.discount, 
                p.status,
                m.id, 
                c.id, 
                m.manufacturer_name, 
                c.category_name
            ${sortFilter}
            LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );

    let count = 0;
    if(result.rows.length > 0){
      count = parseInt(result.rows[0].total_count);
    }

    return {
      totalCount: count,
      products: result.rows,
    };
  } catch (error) {
    console.error(
      `Error fetching ${products_category} products from productService:`,
      error.message,
      {
          minPrice, maxPrice, sort, manufacturer, search, products_category, startDate, endDate, fps,
        stack: error.stack
      }
    );
    return { totalCount: 0, products: [] };
  }
}

/**
 * Get all manufacturers of a specific product category.
 *
 * @param {string} products_category category of products, e.g. "computers". If not provided, categories of all products will be fetched. e.g. "computers".
 * @returns {Promise<Array>} An array of manufacturers.
 */
async function getAllManufacturersOfCategory(products_category) {
  let productsCategoryFilter = '';
  if (products_category != null)
    productsCategoryFilter = `WHERE category_id = (SELECT id from categories where category_name = '${products_category}')`;

  const manufacturersList = await pool.query(`
        SELECT DISTINCT(m.manufacturer_name) 
        FROM products p
        JOIN manufacturers m ON p.manufacturer_id = m.id
        ${productsCategoryFilter}
        `);

  const manufacturers = manufacturersList.rows.map((row) => row.manufacturer_name);
  return manufacturers;
}

/**
 * Fetches a product by its ID from the database.
 * 
 * @param {number} id - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the product object if found, or an empty array if not found.
 * @returns {Object} return - The product object.
 * @returns {number} return.id - Product ID.
 * @returns {string} return.name - Product name.
 * @returns {number} return.category_id - Category ID.
 * @returns {number} return.manufacturer_id - Manufacturer ID.
 * @returns {number} return.price - Product price.
 * @returns {string} return.image_url - URL of the product image.
 * @returns {string} return.detail - Product details.
 * @returns {number} return.discount - Discount on the product.
 * @returns {number} return.number - Number of products.
 * @returns {Date} return.last_modified - Last modified timestamp.
 * @returns {number} return.fps_hz - FPS (Hz).
 * @returns {number} return.screen_width_inches - Screen width in inches.
 * @returns {string} return.status - Product status.
 * @returns {number} return.total_purchased - Total number of products purchased.
 * @returns {string} return.manufacturer_name - Manufacturer name.
 * @returns {string} return.category_name - Category name.
 * @returns {Date} return.created_at - Product creation timestamp.
 * @throws {Error} - Throws an error if there is an issue with the database query.
 * @example
 * const product = await getProductById(1);
 * // {
 * //   id: 1,
 * //   name: 'Product Name',
 * //   category_id: 2,
 * //   manufacturer_id: 3,
 * //   price: 100,
 * //   image_url: 'http://example.com/image.jpg',
 * //   detail: 'Product details',
 * //   discount: 10,
 * //   number: 50,
 * //   last_modified: '2023-10-01T00:00:00.000Z',
 * //   fps_hz: 60,
 * //   screen_width_inches: 15.6,
 * //   status: 'On stock',
 * //   total_purchased: 200,
 * //   manufacturer_name: 'Manufacturer Name',
 * //   category_name: 'Category Name'
 * // }
 */
async function getProductById(id) {
  try {
    const query = `
    SELECT p.*, m.manufacturer_name, c.category_name
    FROM products p
    JOIN manufacturers m ON p.manufacturer_id = m.id
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching product by ID', error);
    return [];
  }
}

/**
 * Get related products, excluding the current product.
 * Each record in the 'products' array contains the following fields:
 * - id: The ID of the product.
 * - name: The name of the product.
 * - image_url: The URL of the product image.
 * - number: The product number.
 * - price: The price of the product.
 * - discount: The discount on the product.
 * - category_name: The name of the category.
 * - manufacturer_name: The name of the manufacturer.
 * - reviewer_count: The number of reviewers.
 * - review_average: The average rating of the product.
 *
 * @param {number} currentId - The ID of the current product.
 * @param {number} [limit=3] - The maximum number of related products to fetch. If not provided, the default is 3.
 * @returns {Promise<Array>} - A list of related products.
 * @example
 * const relatedProducts = await getRelatedProductsFromProductId(1, 3);
 * // [
 * //   {
 * //     id: 2,
 * //     name: 'Related Product 1',
 * //     image_url: 'http://example.com/image1.jpg',
 * //     number: 10,
 * //     price: 200,
 * //     discount: 15,
 * //     category_name: 'mobilephones',
 * //     manufacturer_name: 'Manufacturer 1',
 * //     reviewer_count: 5,
 * //     review_average: 4.2
 * //   },
 * //   {
 * //     id: 3,
 * //     name: 'Related Product 2',
 * //     image_url: 'http://example.com/image2.jpg',
 * //     number: 20,
 * //     price: 300,
 * //     discount: 10,
 * //     category_name: 'mobilephones',
 * //     manufacturer_name: 'Manufacturer 2',
 * //     reviewer_count: 8,
 * //     review_average: 4.5
 * //   }
 * // ]
 */
async function getRelatedProductsFromProductId(currentId, categoryName, limit = 3) {
  try {
    const query = `
    SELECT p.id, p.name, p.image_url, p.number, p.price, p.discount, p.status, 
          c.category_name, m.manufacturer_name, COUNT(DISTINCT r.user_id) AS reviewer_count, AVG(r.rating) AS review_average
    FROM products p JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r on r.product_id = p.id
    JOIN manufacturers m ON p.manufacturer_id = m.id
    WHERE category_id = (SELECT id from categories where category_name = $2)
    AND p.id <> $1
    GROUP BY 
              p.id, 
              p.name, 
              p.image_url, 
              p.number, 
              p.price, 
              p.discount, 
              p.status,
              m.id, 
              c.id, 
              m.manufacturer_name, 
              c.category_name
    ORDER BY RANDOM() 
    LIMIT $3
    `;
    const result = await pool.query(query, [currentId, categoryName, limit]);
    return result.rows;
  } catch (error) {
      console.error('Error fetching related' + categoryName +' products of product id ' + currentId +'; error:\n'+ error);
      return [];
  }
}

async function updateProductNumberOnStock(productID, quantityPurchased, productName) {
  try {
    if(quantityPurchased <= 0) {
      throw new Error('Invalid quantity purchased');
    }

    const oldNumber = await pool.query('SELECT number FROM products WHERE id = $1', [productID]);
    if(oldNumber.rows.length === 0) {
      throw new Error('Product not found');
    }

    if(oldNumber.rows[0].number < quantityPurchased) {
      throw new Error('Not enough products in stock for product ' + productName);
    }

    const query = `UPDATE products SET number = number - $1 WHERE id = $2 RETURNING number`;
    const newNumber = await pool.query(query, [quantityPurchased, productID]);

    if(0 == newNumber.rows[0].number){
      await pool.query('UPDATE products SET status = $1 WHERE id = $2', ['Out of stock', productID]);
    }

    return true;
  } catch (error) {
    console.log('Error updating product number on stock:', error);
    throw error;
  }
}

module.exports = {
  getAllProductsOfCategoriesWithFilterAndCount,
  getAllManufacturersOfCategory,
  getProductById,
  getRelatedProductsFromProductId,
  updateProductNumberOnStock,
};

const pool = require('../../config/database');
const { prepareFilterStatements } = require('../Utils/filterStatementUtils');
/**
 * Get all discounted products with filters applied and the total number of products.
 * Each record in the 'products' array contains the following fields:
 * - id
 * - name
 * - manufacturer
 * - price
 * - imageurl
 * - detail
 * - discount
 * - number (number of products in stock)
 * - category_name (category of product)
 * - review_average (average rating of the product)
 * - reviewer_count (number of distinct reviews for the product)
 * - total_count (total number of products matching the filters)
 *
 * @param {number} minPrice - Minimum price filter.
 * @param {number} maxPrice - Maximum price filter.
 * @param {number} page - Page number for pagination, expected to be greater than 0.
 * @param {number} limit - Number of items per page.
 * @param {string} manufacturer - manufacturer filter.
 * @param {string} search - Search keyword.
 * @param {string} startDate - start date
 * @param {string} endDate - end date
 * @param {number} fps - frame fresh rate
 * @returns {Promise<Object>} - An object containing the total count of discounted products and the list of discounted products.
 * @returns {number} return.totalCount - Total number of discounted products matching the filters.
 * @returns {Array} return.products - Array of discounted products in random order.
 * @example
 * const {totalCount, products} = await getAllDiscountedProductsWithFilterAndCount(0, 1000, 1, 10, "price,ASC", "Samsung", "samsung galaxy s8");
 */
async function getAllDiscountedProductsWithFilterAndCount(
  minPrice,
  maxPrice,
  page,
  limit,
  sort,
  manufacturer,
  search,
  startDate,
  endDate,
  fps
) {
  try {
    page = Math.max(1, page);
    const {
      priceFilter, 
      manufacturerFilter, 
      searchFilter,
      productsCategoryFilter,
      dateFilter, 
      fpsFilter,
    } = prepareFilterStatements(minPrice, maxPrice, sort, manufacturer, search, null, startDate, endDate, fps);
    
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
            WHERE p.discount > 0 
              ${productsCategoryFilter}
              ${searchFilter}
              ${priceFilter}
              ${dateFilter}
              ${fpsFilter}
              ${manufacturerFilter}
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
    console.error(`Error fetching all discounted products:`, error.message);
    return { totalCount: 0, products: [] };
  }
}

module.exports = {
  getAllDiscountedProductsWithFilterAndCount,
};

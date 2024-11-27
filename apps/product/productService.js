const pool = require("../../config/database");
const prepareFilterStatements = require("../Utils/preparingFilterStatements");

/**
 * Get all products of a specific type with filters applied.
 * Each record in the result set contains the following fields:
 * - id
 * - name
 * - brand
 * - price
 * - imageurl
 * - discount
 * - numberofpro (number of products)
 * - type_name (type of product)
 * 
 * @param {number} minPrice - Minimum price filter.
 * @param {number} maxPrice - Maximum price filter.
 * @param {number} page - Page number for pagination, expected to be greater than 0.
 * @param {number} limit - Number of items per page.
 * @param {string} sort - Sort order (column, direction). e.g. "id,ASC".
 * @param {string} brand - Brand filter.
 * @param {string} search - Search keyword.
 * @param {string} products_type - Type of products. e.g. "computers". If not provided, all products will be fetched.
 * @returns {Promise<Array>} - List of products.
 */
async function getAllProductsOfTypeWithFilter(minPrice, maxPrice, page, limit, sort, brand, search, products_type) {
    try {
        const {
            priceFilter, 
            sortDirection, 
            brandFilter, 
            searchFilter, 
            productsTypeFilter} 
            = prepareFilterStatements(
                minPrice, maxPrice, sort, 
                brand, search, products_type);
        
        const result = await pool.query(`
            SELECT p.id, p.name, p.brand, p.price, p.imageurl, p.detail, p.discount, p.numberofpro, t.type_name FROM products p JOIN types t ON p.type_id = t.id
            WHERE 1=1
            ${productsTypeFilter}
            ${searchFilter}
            ${brandFilter}
            ${priceFilter}
            ORDER BY ${sort.split(",")[0]} ${sortDirection}
            LIMIT $1 OFFSET $2`,
            [limit, (page - 1) * limit]
        );      
    
        return result.rows;
  
    } catch (error) {
        console.error(`Error fetching ${products_type} products:`, error.message);
        return { result: [], total: 0, brands: [] };
    }
}

/**
 * Get all brands of a specific product type.
 * 
 * @param {string} products_type Type of products.
 * @returns {Promise<Array>} List of brands.
 */
async function getAllBrandsOfType(products_type) {
    let productsTypeFilter = "";
    if(products_type)
        productsTypeFilter = `WHERE type_id = (SELECT id from types where type_name = '${products_type}')`;

    const brandsList = await pool.query(`
        SELECT DISTINCT(brand) 
        FROM products
        ${productsTypeFilter}
        `
      );

    const brands = brandsList.rows.map(row => row.brand);
    return brands;
}

/**
 * Count all products of a specific type with filters applied.
 * 
 * @param {number} minPrice - Minimum price filter.
 * @param {number} maxPrice - Maximum price filter.
 * @param {string} sort - Sort order (column, direction). e.g. "id,ASC".
 * @param {string} brand - Brand filter.
 * @param {string} search - Search keyword.
 * @param {string} products_type - Type of products.
 * @returns {Promise<number>} Total count of products.
 */
async function countAllProductsOfTypeWithFilters(minPrice, maxPrice, sort, brand, search, products_type) {
    const {
        priceFilter, 
        sortDirection, // not used here
        brandFilter, 
        searchFilter, 
        productsTypeFilter} 
        = prepareFilterStatements(
            minPrice, maxPrice, sort, 
            brand, search, products_type);

    //no need to sort
    const totalResult = await pool.query(
        `SELECT COUNT(*) 
        FROM products 
        WHERE 1=1 
        ${productsTypeFilter}
        ${searchFilter}
        ${brandFilter}
        ${priceFilter}
        ;`
    );
    const total = parseInt(totalResult.rows[0].count);
    return total;
}

module.exports = {
    getAllProductsOfTypeWithFilter,
    getAllBrandsOfType,
    countAllProductsOfTypeWithFilters,
}
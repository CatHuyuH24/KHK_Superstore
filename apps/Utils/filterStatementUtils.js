/**
 * Prepare SQL filter statements based on provided inputs.
 * 
 * @param {number} minPrice - Minimum price filter.
 * @param {number} maxPrice - Maximum price filter.
 * @param {string} sort - Sort order (column, direction), e.g. "id,ASC".
 * @param {string} brand - Brand filter.
 * @param {string} search - Search keyword.
 * @param {string} products_type - Type of products, e.g. "mobilephones". If not provided, all products are considered.
 * @returns {Object} Object containing SQL filter statements.
 * * {string} priceFilter - SQL statement for price filter. Blank if no price filter is applied.
 * * {string} sortDirection - Sort direction. Default is "ASC".
 * * {string} brandFilter - SQL statement for brand filter. Blank if no brand filter is applied.
 * * {string} searchFilter - SQL statement for search filter. Blank if no search filter is applied.
 * * {string} productsTypeFilter - SQL statement for product type filter. Blank if no product type filter is applied.
 * @example
 * const {priceFilter, sortDirection, brandFilter, searchFilter, productsTypeFilter} = prepareFilterStatements(100, 500, "price,ASC", "Samsung", "Galaxy", "mobilephones");
 */
function prepareFilterStatements(minPrice, maxPrice, sort, brand, search, products_type) {
    let productsTypeFilter = "";
    if(products_type != null)
        productsTypeFilter = `AND type_id = (SELECT id from types where type_name = '${products_type}')`;

    // initialize filters
    let brandFilter = brand === "All" ? "" : `AND brand IN (${brand.split(",").map(g => `'${g}'`).join(", ")})`;
    let searchFilter = search ? `AND name ILIKE '%${search}%'` : "";
    let priceFilter = ""; 

    if (minPrice !== null && maxPrice !== null) {
        priceFilter = `AND price BETWEEN ${minPrice} AND ${maxPrice}`;
    } else if (minPrice !== null) {
        priceFilter = `AND price >= ${minPrice}`;
    } else if (maxPrice !== null) {
        priceFilter = `AND price <= ${maxPrice}`;
    }

    let sortDirection = sort.split(",")[1] || "ASC";
    return {priceFilter, sortDirection, brandFilter, searchFilter, productsTypeFilter};
}

module.exports = {
    prepareFilterStatements,
};
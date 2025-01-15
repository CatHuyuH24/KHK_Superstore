const televisionService = require("./televisionService");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const {calculateDiscountedPrice} = require("../Utils/discountedPriceUtils");
const { user } = require("pg/lib/defaults");
const reviewService = require('../../services/reviews/reviewService');
const productService = require('../../services/product/productService');

async function renderTelevisionCategoryPage(req, res) {
  try {
    const page = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 6;
    let sort = req.query.sort || "id";
    let manufacturer = req.query.manufacturer || "All";
    const search = req.query.search || "";
    const minPrice = req.query.min ? parseInt(req.query.min) : null;
    const maxPrice = req.query.max ? parseInt(req.query.max) : null;
    const selectedManufacturers = manufacturer === "All" ? [] : manufacturer.split(",");
    const userID = res.locals.user ? res.locals.user.id : null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const fps =req.query.fps || ''

    const selectedFPS = fps === 'All' ? [] : fps.split(',').map(fpsValue => parseInt(fpsValue, 10));
    const {totalCount, products} = 
    await televisionService.getAllTelevisionsWithFilterAndCount(
        minPrice,
        maxPrice,
        page,
        limit,
        sort,
        manufacturer,
        search,
        startDate,
        endDate,
        fps,
        'televisions',
    );

    products.forEach(product => {
      product.price = calculateDiscountedPrice(product.price, product.discount);
    });

    const manufacturersList = await televisionService.getAllTelevisionManufacturers();

    const response = {
      title: "Televisions - Superstore",
      error: false,
      total: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / limit),
      itemsPerPage: limit,
      products: products,
      manufacturers: manufacturersList,
      selectedManufacturers,
      selectedFPS,
      user_id: userID,
    };

    if (req.xhr) {
      return res.json(response);
    }

    return res.render("category", response);
  } catch (error) {
    console.error("Error rendering television category page:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

async function renderTelevisionDetailPage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const televisionID = req.params.id;
    const television = await televisionService.getTelevisionByID(televisionID);
    const userID = res.locals.user ? res.locals.user.id : null;
    television.price = calculateDiscountedPrice(television.price, television.discount);

    const relatedTelevisions = await productService.getRelatedProductsFromProductId(televisionID,  television.category_name, 8);
    relatedTelevisions.forEach((product) => {
      product.price = calculateDiscountedPrice(product.price, product.discount);
    });

    const {reviews, reviewAverage, reviewerCount, totalCount} = await reviewService.getReviewsByProductId(televisionID, page, limit);
    const TITLE = television.name + " - Superstore";
    const response = {
      product: television, 
      related_products: relatedTelevisions, 
      title: TITLE, 
      user_id: userID, 
      reviews: reviews,
      review_average: reviewAverage,
      reviewer_count: reviewerCount,
      total_reviews_count: totalCount,
      total_pages: Math.ceil(totalCount / limit),
      page: page,
      reviews_per_page: limit,
      error: false,
    }

    // Set Cache-Control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json(response);
    }
    res.render('product', response);
  } catch (error) {
    console.error("Error rendering television detail page:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

module.exports = {
  renderTelevisionCategoryPage,
  renderTelevisionDetailPage,
};

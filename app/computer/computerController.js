const computerService = require("./computerService");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const {calculateDiscountedPrice} = require("../Utils/discountedPriceUtils");
const reviewService = require('../../services/reviews/reviewService');
const productService = require('../../services/product/productService');
const redisClient = require("../../config/redisClient");
async function renderComputerCategoryPage(req, res) {
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
    await computerService.getAllComputersWithFilterAndCount
    (
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
      'computers',
    );

    products.forEach(product => {
      product.price = calculateDiscountedPrice(product.price, product.discount);
    });

    const manufacturersList = await computerService.getAllComputerManufacturers();

    const response = {
      title: "Computers - Superstore",
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
    const key = req.originalUrl;
    return res.render("category", response, async (err, html) => {
      if (err) {
        console.error("Error rendering computer category page:", err);
        res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
      redisClient.setex(key, 300, html);
      res.send(html);
    });
  } catch (error) {
    console.error("Error rendering computer category page:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

async function renderComputerDetailPage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const computerID = req.params.id;
    const computer = await computerService.getComputerByID(computerID);
    const userID = res.locals.user ? res.locals.user.id : null;
    computer.price = calculateDiscountedPrice(computer.price, computer.discount);

    const relatedComputers = await productService.getRelatedProductsFromProductId(computerID, computer.category_name, 8);
    relatedComputers.forEach((product) => {
      product.price = calculateDiscountedPrice(product.price, product.discount);
    });

    const {reviews, reviewAverage, reviewerCount, totalCount} = await reviewService.getReviewsByProductId(computerID, page, limit);
    const TITLE = computer.name + " - Superstore";
    const response = {
      product: computer, 
      related_products: relatedComputers, 
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
    const key = req.originalUrl;
    res.render('product', response, async(err, html)=>{
      if(err){
        console.error("Error rendering computer detail page:", err);
        res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
      redisClient.setex(key, 180, html);
      res.send(html);
    });
  } catch (error) {
    console.error("Error rendering computer detail page:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

module.exports = {
  renderComputerCategoryPage,
  renderComputerDetailPage,
};

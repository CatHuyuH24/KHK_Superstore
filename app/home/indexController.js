const indexService = require('./indexService');
const productService = require('../../services/product/productService');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const redisClient = require('../../config/redisClient');
const { calculateDiscountedPrice } = require('../Utils/discountedPriceUtils');

async function renderHomePage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    let sort = req.query.sort || 'id';
    let manufacturer = req.query.manufacturer || 'All';
    const search = req.query.search || '';
    const minPrice = req.query.min ? parseInt(req.query.min) : null;
    const maxPrice = req.query.max ? parseInt(req.query.max) : null;
    const userID = res.locals.user ? res.locals.user.id : null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const fps =req.query.fps || ''

    const selectedFPS = fps === 'All' ? [] : fps.split(',').map(fpsValue => parseInt(fpsValue, 10));
    const selectedManufacturers =
      manufacturer === 'All' ? [] : manufacturer.split(',');

    const { totalCount, products } =
      await indexService.getAllDiscountedProductsWithFilterAndCount(
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
      );

      products.forEach(product => {
        product.price = calculateDiscountedPrice(product.price, product.discount);
      })

    // get manufacturers of all products
    const allmanufacturers =
      await productService.getAllManufacturersOfCategory();

      // products.forEach(product => {
      //   if(product.review_average == null) {
      //     product.review_average = Number(100);
      //   }
      // });
    const response = {
      title: 'Homepage - Superstore',
      error: false,
      total: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / limit),
      itemsPerPage: limit,
      products: products,
      manufacturers: allmanufacturers,
      selectedManufacturers,
      selectedFPS,
      user_id: userID,
    };

    if (req.xhr) {
      return res.json(response);
    }
    const key = req.originalUrl;
    return res.render('index', response, async (err, html) => {
      if (err) {
        console.error('Error rendering home page:', err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }
      redisClient.setex(key, 300, html);
      return res.send(html);
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

module.exports = {
  renderHomePage,
};

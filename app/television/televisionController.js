const televisionService = require("./televisionService");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const {calculateDiscountedPrice} = require("../Utils/discountedPriceUtils");
const { user } = require("pg/lib/defaults");

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
    const televisionID = req.params.id;
    const television = await televisionService.getTelevisionByID(televisionID);
    const userID = res.locals.user ? res.locals.user.id : null;
    television.price = calculateDiscountedPrice(television.price, television.discount);

    const relatedComputers = await televisionService.getRelatedTelevisions(televisionID, 5);
    relatedComputers.forEach((product) => {
      product.price = calculateDiscountedPrice(product.price, product.discount);
    });

    const TITLE = television.name + " - Superstore";

    res.render("product", { product: television, relatedProducts: relatedComputers, title: TITLE, user_id: userID });
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

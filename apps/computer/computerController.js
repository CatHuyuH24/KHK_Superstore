const computerService = require("./computerService");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");

async function renderCompterCategoryPage(req, res) {
  try {
    const sortBy = req.query.sortBy || "";
    const products = await computerService.getAllComputers(sortBy);
    res.render("category", {
      title: "Computer Category",
      products: products,
      category: "computers",
      sortBy,
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
    const computerID = req.params.id;
    const queryResult = await computerService.getComputerByID(computerID);
    res.render("product", { product: queryResult.rows[0] });
  } catch (error) {
    console.error("Error rendering computer detail page:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

module.exports = {
  renderCompterCategoryPage,
  renderComputerDetailPage,
};
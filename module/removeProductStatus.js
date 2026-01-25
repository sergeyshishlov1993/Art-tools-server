const { products: Product } = require("../db");

function removeProductStatus(column, id, sale_price) {
  const updateValues = { [column]: "false" };
  const queryOptions = { where: { product_id: id } };

  if (sale_price !== undefined) {
    updateValues.sale_price = sale_price;
  }

  Product.update(updateValues, queryOptions);
}

module.exports = removeProductStatus;

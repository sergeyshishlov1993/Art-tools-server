const { products: Products } = require("../../../../db");

async function updateSaleProduct(id, newPrice) {
  await Products.update(
    {
      sale: "true",
      sale_price: newPrice,
    },
    {
      where: { product_id: [id] },
    }
  );
}

module.exports = updateSaleProduct;

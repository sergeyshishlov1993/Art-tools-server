const { products: Products } = require("../../../../db");

async function updateStatusProduct(id) {
  await Products.update(
    {
      bestseller: "true",
    },
    {
      where: { product_id: [id] },
    }
  );
}

module.exports = updateStatusProduct;

const {
  products: Product,
  review: Review,
  pictures: Pictures,
  parameter: Parameter,
  reviewResponses: ReviewResponse,
} = require("../db");

async function getProductByStatus(tableColumn, limit) {
  const queryOptions = {
    where: { [tableColumn]: "true", available: "true" },

    include: [
      {
        model: Pictures,
        as: "pictures",
      },
      {
        model: Parameter,
        as: "param",
      },
      {
        model: Review,
        as: "review",
        include: [
          {
            model: ReviewResponse,
            as: "reviewResponses",
          },
        ],
      },
    ],
  };

  if (limit !== undefined) {
    queryOptions.limit = limit;
  }

  const products = await Product.findAll(queryOptions);
  return products;
}

module.exports = getProductByStatus;

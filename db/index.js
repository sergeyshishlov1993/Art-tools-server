require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,
  }
);

const Products = require("./Products")(sequelize);
const Pictures = require("./Pictures")(sequelize);
const Parameter = require("./Parameter")(sequelize);
const Review = require("./Review")(sequelize);
const ReviewResponse = require("./ReviewResponse")(sequelize);
const Feedback = require("./Feedback")(sequelize);
const Category = require("./category")(sequelize);
const SubCategory = require("./subCategory")(sequelize);
const Order = require("./Orders")(sequelize);
const OrderItem = require("./OrderItems")(sequelize);
const SliderImg = require("./SliderImg")(sequelize);
const Admin = require("./Login")(sequelize);

Products.hasMany(Pictures, {
  as: "pictures",
  foreignKey: "product_id",
  onDelete: "CASCADE",
});

Pictures.belongsTo(Products, {
  foreignKey: "product_id",
});

Products.hasMany(Parameter, {
  as: "param",
  foreignKey: "product_id",
  onDelete: "CASCADE",
});

Parameter.belongsTo(Products, {
  foreignKey: "product_id",
});

Products.hasMany(Review, {
  as: "review",
  foreignKey: "product_id",
  onDelete: "CASCADE",
});

Review.belongsTo(Products, {
  foreignKey: "product_id",
});

Review.hasMany(ReviewResponse, {
  as: "reviewResponses",
  foreignKey: "review_id",
  onDelete: "CASCADE",
});

ReviewResponse.belongsTo(Review, {
  foreignKey: "review_id",
});

Order.hasMany(OrderItem, {
  as: "orderItem",
  foreignKey: "order_id",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: "order_id",
});

module.exports = {
  sequelize: sequelize.sync(),
  products: Products,
  pictures: Pictures,
  parameter: Parameter,
  review: Review,
  reviewResponses: ReviewResponse,
  feedback: Feedback,
  category: Category,
  subCategory: SubCategory,
  order: Order,
  orderItem: OrderItem,
  slider: SliderImg,
  admin: Admin,
};

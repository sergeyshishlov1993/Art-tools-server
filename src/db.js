const { Sequelize } = require("sequelize");
const config = require("./config/database");

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: config.dialect,
        logging: config.logging
    }
);

const Product = require("./models/Products")(sequelize);
const Picture = require("./models/Pictures")(sequelize);
const Parameter = require("./models/Parameter")(sequelize);
const Review = require("./models/Review")(sequelize);
const ReviewResponse = require("./models/ReviewResponse")(sequelize);
const Feedback = require("./models/Feedback")(sequelize);
const Category = require("./models/Category")(sequelize);
const SubCategory = require("./models/SubCategory")(sequelize);
const CategoryMapping = require("./models/CategoryMapping")(sequelize);
const CategoryFilter = require("./models/CategoryFilter")(sequelize);
const Order = require("./models/Orders")(sequelize);
const OrderItem = require("./models/OrderItems")(sequelize);
const SliderImage = require("./models/SliderImg")(sequelize);
const Admin = require("./models/Admin")(sequelize);

Product.hasMany(Picture, { as: "pictures", foreignKey: "product_id", onDelete: "CASCADE" });
Picture.belongsTo(Product, { foreignKey: "product_id" });

Product.hasMany(Parameter, { as: "params", foreignKey: "product_id", onDelete: "CASCADE" });
Parameter.belongsTo(Product, { foreignKey: "product_id" });

Product.hasMany(Review, { as: "reviews", foreignKey: "product_id", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "product_id" });

Review.hasMany(ReviewResponse, { as: "responses", foreignKey: "review_id", onDelete: "CASCADE" });
ReviewResponse.belongsTo(Review, { foreignKey: "review_id" });

Order.hasMany(OrderItem, { as: "items", foreignKey: "order_id", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

sequelize.sync();

module.exports = {
    sequelize,
    Product,
    Picture,
    Parameter,
    Review,
    ReviewResponse,
    Feedback,
    Category,
    SubCategory,
    CategoryMapping,
    CategoryFilter,
    Order,
    OrderItem,
    SliderImage,
    Admin
};

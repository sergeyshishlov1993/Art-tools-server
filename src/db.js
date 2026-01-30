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

const Admin = require("./models/Admin")(sequelize);
const Category = require("./models/Category")(sequelize);
const CategoryFilter = require("./models/CategoryFilter")(sequelize);
const CategoryMapping = require("./models/CategoryMapping")(sequelize);
const Feedback = require("./models/Feedback")(sequelize);
const ImportSource = require('./models/ImportSource')(sequelize);
const Order = require("./models/Orders")(sequelize);
const OrderItem = require("./models/OrderItems")(sequelize);
const Parameter = require("./models/Parameter")(sequelize);
const Picture = require("./models/Pictures")(sequelize);
const Product = require("./models/Products")(sequelize);
const Review = require("./models/Review")(sequelize);
const ReviewResponse = require("./models/ReviewResponse")(sequelize);
const SliderImage = require("./models/SliderImg")(sequelize);
const SubCategory = require("./models/SubCategory")(sequelize);

Product.hasMany(Picture, {
    as: "pictures",
    foreignKey: "product_id",
    onDelete: "CASCADE"
});
Picture.belongsTo(Product, {
    as: "product",
    foreignKey: "product_id"
});

Product.hasMany(Parameter, {
    as: "params",
    foreignKey: "product_id",
    onDelete: "CASCADE"
});
Parameter.belongsTo(Product, {
    as: "product",
    foreignKey: "product_id"
});

Product.hasMany(Review, {
    as: "reviews",
    foreignKey: "product_id",
    onDelete: "CASCADE"
});

Review.belongsTo(Product, {
    as: "product",
    foreignKey: "product_id"
});

Category.hasMany(SubCategory, {
    as: "subCategories",
    foreignKey: "parent_id",
    sourceKey: "id"
});

SubCategory.belongsTo(Category, {
    as: "category",
    foreignKey: "parent_id",
    targetKey: "id"
});

SubCategory.hasMany(Product, {
    as: "products",
    foreignKey: "sub_category_id"
});

Product.belongsTo(SubCategory, {
    as: "subCategory",
    foreignKey: "sub_category_id"
});

SubCategory.hasOne(CategoryFilter, {
    as: "filters",
    foreignKey: "sub_category_id"
});

CategoryFilter.belongsTo(SubCategory, {
    as: "subCategory",
    foreignKey: "sub_category_id"
});

Review.hasMany(ReviewResponse, {
    as: "responses",
    foreignKey: "review_id",
    onDelete: "CASCADE"
});
ReviewResponse.belongsTo(Review, {
    as: "review",
    foreignKey: "review_id"
});

Order.hasMany(OrderItem, {
    as: "items",
    foreignKey: "order_id",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    as: "order",
    foreignKey: "order_id"
});

module.exports = {
    Admin,
    Category,
    CategoryFilter,
    CategoryMapping,
    Feedback,
    ImportSource,
    Order,
    OrderItem,
    Parameter,
    Picture,
    Product,
    Review,
    ReviewResponse,
    Sequelize,
    SliderImage,
    SubCategory,
    sequelize,
};

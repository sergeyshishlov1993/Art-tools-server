const { DataTypes, Op } = require("sequelize");

module.exports = function (sequelize) {
    const Product = sequelize.define(
        "Products",
        {
            product_id: {
                type: DataTypes.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            xml_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            supplier_prefix: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            slug: {
                type: DataTypes.STRING(500),
                unique: true,
                allowNull: true,
            },
            sub_category_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            is_manual_category: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            product_name: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            product_description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            brand: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            sale_price: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: true,
            },
            discount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            available: {
                type: DataTypes.STRING(50),
                defaultValue: "true",
                allowNull: false,
            },
            bestseller: {
                type: DataTypes.STRING(50),
                defaultValue: "false",
                allowNull: false,
            },
            sale: {
                type: DataTypes.STRING(50),
                defaultValue: "false",
                allowNull: false,
            },
            custom_product: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
        },
        {
            tableName: "products",
            timestamps: true,
        }
    );

    Product.addScope('available', {
        where: { available: 'true' }
    });

    Product.addScope('withDiscount', {
        where: { discount: { [Op.gt]: 0 } }
    });

    Product.addScope('bestsellers', {
        where: { bestseller: 'true' }
    });

    Product.addScope('bySupplier', (prefix) => ({
        where: { supplier_prefix: prefix }
    }));

    Product.addScope('byCategory', (categoryId) => ({
        where: { sub_category_id: categoryId }
    }));

    Product.generateProductId = function(supplierPrefix, xmlId) {
        return `${supplierPrefix}_${xmlId}`;
    };

    Product.prototype.isOnSale = function() {
        return this.discount > 0 || this.sale === 'true';
    };

    Product.prototype.getFinalPrice = function() {
        return parseFloat(this.price);
    };

    Product.prototype.getOldPrice = function() {
        return this.sale_price ? parseFloat(this.sale_price) : null;
    };

    return Product;
};

const {
    Product,
    Picture,
    Parameter,
    Review,
    ReviewResponse
} = require('../db');

class ProductService {
    static async getByStatus(status, limit) {
        const queryOptions = {
            where: {
                [status]: 'true',
                available: 'true'
            },
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' },
                {
                    model: Review,
                    as: 'reviews',
                    include: [
                        { model: ReviewResponse, as: 'responses' }
                    ]
                }
            ]
        };

        if (limit) {
            queryOptions.limit = limit;
        }

        return Product.findAll(queryOptions);
    }

    static async removeStatus(productId, status) {
        return Product.update(
            { [status]: 'false' },
            { where: { product_id: productId } }
        );
    }

    static async setStatus(productId, status, value = 'true') {
        return Product.update(
            { [status]: value },
            { where: { product_id: productId } }
        );
    }
}

module.exports = ProductService;

import Product from "../models/product.model.js";

export const createProduct = async (req, res) => {
    try {
        const {name, display_name, description, short_description, price, discounted_price, stock, category_id, created_by} = req.body;

        if (!name || !display_name || !price) {
            return res.status(400).json({
                message: 'Name, Display Name and price are required'
            });
        }
        const result = await Product.create({name, display_name, description, short_description, price, discounted_price, stock, category_id, created_by});

        res.status(201).json({
            message: 'Product created successfully',
            userId: result.insertId
        });
    } catch (error) {
        res.status(500).json({
        message: 'Error creating product',
        error: error.message
        });
    }
};
export default createProduct;

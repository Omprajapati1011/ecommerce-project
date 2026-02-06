import db from "../configs/db.js";

const Product = {
    create: (data) => {
        const sql = 'INSERT INTO product_master (name, display_name, description, short_description, price, discounted_price, stock, category_id, created_by) VALUES (?,?,?,?,?,?,?,?,?)';
        
        return db.execute(sql, [
            data.name,
            data.display_name,
            data.description,
            data.short_description,
            data.price,
            data.discounted_price,
            data.stock,
            data.category_id,
            data.created_by
        ]);
    }
}

export default Product;

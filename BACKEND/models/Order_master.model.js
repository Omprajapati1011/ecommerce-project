import pool from "../configs/db.js"

import mysql from "mysql2/promise";

// Get all items in the cart for a given user.
export const getCart = async (user_id) => {
    const userId = 2;
    // const [cart] = await pool.query(`select ci.product_id,
    //         ci.quantity,
    //         ci.price,
    //         (ci.quantity * ci.price) AS total_price from cart_items ci join cart_master cm on ci.cart_id  = cm.cart_id  where cm.user_id =?`, [user_id])
    // return cart;
        //discount
  
   
    console.log(discount)
    return cart;
}
// For each product, get the minimum category_id (primary category).
export const getCompareProductCategory = async (productIds) => {
    const [compare] = await pool.query(`select product_id,min(category_id) as category_id from
                                        product_categories where product_id in (?)
                                        group by product_id`, [productIds]);
    return compare;
}

// Get the address_id for a user (or null if not found).
export const getUserAddress = async (user_id) => {
    const [rows] = await pool.query("select address_id  from user_addresses  where user_id= ?", [user_id])
    return rows[0]?.address_id || null;
}

// Get discount rules (type + value) for a list of category ids.
export const getDisOnProduct = async (productsIds) => {
    const [disOnProduct] = await pool.query("select discount_type, discount_value,product_id from offer_master where product_id in (?)",[productsIds])
    return disOnProduct;
};
export const getDisCategory = async (productsIds) => {
    const [disOncategory] = await pool.query(`select  product_id,category_id from product_categories where product_id in (?)`, [productsIds])
return disOncategory;
};
// Insert a new row into order_master and then update the order_number.
export const insertValue = async (values) => {

    const [rows] = await pool.query(` insert into order_master (order_number,user_id,address_id,
        subtotal,tax_amount,shipping_amount,discount_amount,
        total_amount,order_status ,payment_status, is_deleted,created_by,updated_by)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?)`, values)

    const order_number = `ORD-${rows.insertId}`;

    const inserted = await pool.query(
        "UPDATE order_master SET order_number=? WHERE order_id=?",
        [order_number, rows.insertId]
    );
    return rows;
}
export const getAllOrder = async (userId) => {
    const [rows] = await pool.query("select * from Order_master where user_id=  ? ", [userId])
    return rows;
}
export const getSingleOrder = async (userId, id) => {
    const [rows] = await pool.query("select * from Order_master where user_id =? and order_id=  ? ", [userId, id])
    return rows
}

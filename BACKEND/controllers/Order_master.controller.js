import {
  getCart,
  getCompareProductCategory,
  getUserAddress,
  insertValue,
  getAllOrder,
  getSingleOrder,
  getPortionPrice,
  getPortionValue,
  getDisOnProduct, getDisOnCategory, getProducts,getDisCountOnCat,getRootCategoryId,getModifierValue

} from "../models/Order_master.model.js";

import {
  insertQuery
} from "../models/Order_items.model.js";
import pool from "../configs/db.js"


import { notFound, ok, serverError, created } from "../utils/apiResponse.js";

// Create a new order from user's cart with tax, discounts, and shipping calculations
export const Order_master = async (req, res) => {
  const user_id = 2;

  try {
    // Fetch user's cart items and product details
    const cart = await getCart(user_id)
    const productsIds = cart.map(item => item.product_id)
    const products = await getProducts(productsIds)
    const portionIds = cart.map(item => item.product_portion_id)
    let price = [];
    for (let i = 0; i < portionIds.length; i++) {
      if (portionIds[i] == 0 || portionIds[i] == null) {
        price.push(Number(products[i].price));
        continue;
      }
      const productId = productsIds[i];
      const portionId = portionIds[i];
      const portionPrice = await getPortionPrice(productId, portionId)
      price.push(Number(portionPrice[0].price))
    }
    const totalPrice = price.reduce((sum, val) => sum + val, 0);
    
    // Get product categories for tax calculation
    const [product] = await pool.query(`SELECT product_id, category_id
      FROM product_master
      WHERE product_id IN (?)`, [productsIds])
    const rootCategoryEntries = await Promise.all(
      products.map(async (t) => {
        const rootId = await findRootCategory(t.category_id);
        return [t.product_id, rootId];
      })
    );
    const rootCategoryMap = Object.fromEntries(rootCategoryEntries);

    // Calculate tax for each item based on root category
    const taxAmountArray = cart.map((item, index) => {
      const categoryId = rootCategoryMap[item.product_id];
      const taxPercent = getTaxPercent(categoryId);

      return (price[index] * taxPercent) / 100;
    });

    const totalTax = taxAmountArray.reduce((sum, value) => sum + value, 0);

    // Fetch discounts on products and categories
    const disOnProduct = await getDisOnProduct(productsIds)
    const disOncategory= await getDisOnCategory(productsIds)

    // Calculate discount for each item (product level or category level)
    const disOnPro = disOnProduct.map(item => item.product_id)
    const discount = [];
    const productCategoryMap = {};
    disOncategory.forEach(item => {
      if (!productCategoryMap[item.product_id]) {
        productCategoryMap[item.product_id] = [];
      }
      productCategoryMap[item.product_id].push(item.category_id);
    });
    for (let i = 0; i < productsIds.length; i++) {
      if (disOnPro.includes(productsIds[i])) {
        const discountObj = disOnProduct.find(d => d.product_id === productsIds[i]);
        const discountValue = discountObj ? Number(discountObj.discount_value) : 0;
        discount.push(discountValue)
        continue;
      }
      let maxDiscount = 0;
      for (let j = 0; j < productCategoryMap[productsIds[i]].length; j++) {
        const dis = await getDisCountOnCat(productCategoryMap[productsIds[i]][j])
        if (!dis || dis.length === 0) continue;
        let ans = Number(dis[0].discount_value);
        if (ans.discount_type == "percentage")
          ans = ((Number(ans.discount_value) * price[i]) / 100)
        if (ans > maxDiscount) {
          maxDiscount = ans;
        }
      }
      discount.push(maxDiscount);
    }
    const totalDiscount = discount.reduce((sum, val) => sum + val, 0);

    // Calculate final amount and apply shipping charges
    const final_Amount = totalPrice + totalTax - totalDiscount;
    let shipping_amount = 50;
    if (final_Amount > 500) shipping_amount = 0

    // Get user's address and set order status
    const address_id = await getUserAddress(user_id);
    const order_status = "pending"
    const payment_status = "processing"

    // Prepare order details for insertion
    const order_num = "ORD";

    const values = [
      order_num,
      user_id,
      address_id,
      totalPrice,
      totalTax,
      shipping_amount,
      totalDiscount,
      final_Amount,
      order_status,
      payment_status,
      0,
      user_id,
      user_id,
    ];
    // Insert order master record and create order items
    const insert = await insertValue(values);
    const orderId = insert.insertId;
    await postOrderItems(user_id, orderId, price, taxAmountArray, discount, cart)
    return created(res, "Order created successfully", insert)
  } catch (err) {
    console.log(err)
    return serverError(res)
  }
}

// Retrieve all orders for a user
export const AllOrder = async (req, res) => {
  try {
    const userId = 2;
    const orders = await getAllOrder(userId);
    if (orders.length == 0) {
      return notFound(res, "Orders not found")
    }
    return ok(res, "Orders found Successfully", orders)
  } catch (error) {
    return serverError(res)
  }
}

// Retrieve a specific order by order ID
export const singleOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = 2;
    const order = await getSingleOrder(userId, id);
    if (order.length == 0) return notFound(res, "Order not found")
    return ok(res, "order found Successfully", order)
  } catch (err) {
    console.log(err)
    return serverError(res)
  }
}

// Create order item records for each product in the order
export const postOrderItems = async (userId, orderId, price, taxAmountArray, discount, cart) => {
  // Extract product IDs from cart
  const productIds = cart.map((item) => item.product_id);
  // Fetch primary category for each product
  const productCategories = await getCompareProductCategory(productIds);
  const categoryIds = productCategories.map((item) => item.category_id);
  const modifierIds = cart.map(item => item.modifier_id)
  const portionIds = cart.map(item => item.product_portion_id)
  const portionRows = await getPortionValue(portionIds)
  const modifierRows = await getModifierValue(modifierIds)
  const quantities = cart.map(item => item.quantity)
  const portionMap = Object.fromEntries(
    portionRows.map(p => [p.portion_id, p.portion_value])
  );

  const modifierMap = Object.fromEntries(
    modifierRows.map(m => [m.modifier_id, m.modifier_value])
  );

  // Fetch product names
  const values = [];
  const products = await getProducts(productIds);
  // Create map of product IDs to names
  const productMap = Object.fromEntries(
    products.map(p => [p.product_id, p.name])
  );
  
  // Build order item records with calculated totals
  for (let i = 0; i < cart.length; i++) {
    // Apply shipping charges based on item price
    let shippingAmount = 100;
    if (price[i] > 100) shippingAmount = 0;


    // Calculate final total for this order item
    const finalTotal =
      Number(price[i]) -
      Number(discount[i]) +
      Number(taxAmountArray[i]) +
      Number(shippingAmount);

    // Prepare order item data
    const value = [
      orderId,
      productIds[i],
      portionIds[i],
      modifierIds[i],
      productMap[productIds[i]] || null,
      portionMap[portionIds[i]] || null,
      modifierMap[modifierIds[i]] || null,
      quantities[i],
      Number(price[i]),
      discount[i],
      taxAmountArray[i],
      finalTotal,
      userId,
      userId
    ];
    values.push(value);
  }
  // Insert all order items into database
  await insertQuery(values,productIds)
}

// Find root category ID for tax calculation
const findRootCategory = async (categoryId) => {
  const rows=await getRootCategoryId(categoryId);
  return rows[0]?.category_id;
};

// Get tax percentage based on root category
function getTaxPercent(rootCategoryId) {
  const TAX_RULES = {
    1: 18,
    27: 5
  };
  return TAX_RULES[rootCategoryId] || 0;
}

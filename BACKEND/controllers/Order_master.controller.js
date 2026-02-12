import {
  getCart,
  getCompareProductCategory,
  
  getUserAddress,
  insertValue,
  getAllOrder,
  getSingleOrder

} from "../models/Order_master.model.js";
import {
  insertQuery, getDiscountOnItem, getProducts

} from "../models/Order_items.model.js";
import pool from "../configs/db.js"


import { notFound, ok, serverError, created, badRequest } from "../utils/apiResponse.js";

// Create an order in `order_master` based on the user's cart,
// calculating tax, discounts, shipping and final total.
export const Order_master = async (req, res) => {
  // TODO: replace hard-coded user with authenticated user id
  const user_id = 2;

  try {
    // 1. Get cart and product/category information
    const [cart] = await pool.query(`select ci.product_id,
      ci.quantity,
      ci.product_portion_id, 
      ci.modifier_id
       from cart_items ci join cart_master cm on ci.cart_id  = cm.cart_id  where cm.user_id =?`, [user_id])
    const productsIds = cart.map(item => item.product_id)
    const [products] = await pool.query(
      `SELECT name,price FROM product_master WHERE product_id IN (?)`,
      [productsIds]
    );

    const portionIds = cart.map(item => item.product_portion_id)
    let price = [];
    for (let i = 0; i < portionIds.length; i++) {
      if (portionIds[i] == 0 || portionIds[i] == null) {
        price.push(Number(products[i].price));
        continue;
      }
      const productId = productsIds[i];
      const portionId = portionIds[i];
      const [portionPrice] = await pool.query("select price from product_portion where product_id=? and product_portion_id=?", [productId, portionId])
      price.push(Number(portionPrice[0].price))
    }
    const totalPrice = price.reduce((sum, val) => sum + val, 0);
    const [product] = await pool.query(`SELECT product_id, category_id
      FROM product_master
      WHERE product_id IN (?)`, [productsIds])


    const [tax] = await pool.query(`                             
          SELECT 
  category_id,
      CASE
          WHEN category_id = 1 THEN 18
          WHEN category_id = 27 THEN 5
          ELSE 0
      END AS tax_percent
  FROM category_master
  WHERE parent_id IS NULL;`)

    // Step 1 — create entries
    const rootCategoryEntries = await Promise.all(
      product.map(async (t) => {
        const rootId = await findRootCategory(t.category_id);
        return [t.product_id, rootId];
      })
    );
    const rootCategoryMap = Object.fromEntries(rootCategoryEntries);
    // Step 2 — convert to object
    const taxMap = Object.fromEntries(
      tax.map(t => [
        (t.category_id),
        t.tax_percent
      ])
    );
    const taxAmountArray = cart.map((item, index) => {
      const categoryId = rootCategoryMap[item.product_id];
      const taxPercent = taxMap[categoryId.toString()] || 0;

      return (price[index] * taxPercent) / 100;
    });

    const totalTax= taxAmountArray.reduce((sum, value) => sum + value, 0);

    const [disOnProduct] = await pool.query("select discount_type, discount_value,product_id from offer_master where product_id in (?)",[productsIds])
    const [disOncategory] = await pool.query(`select  product_id,category_id from product_categories where product_id in (?)`, [productsIds])

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
        for (let j=0; j<productCategoryMap[productsIds[i]].length; j++)
        {
            const dis=await disCountOnCat(productCategoryMap[productsIds[i]][j])
            if (!dis || dis.length === 0) continue;
            let ans= Number(dis[0].discount_value);
            if(ans.discount_type=="percentage")
                ans = ((Number(ans.discount_value)*price[i])/100)
            if (ans > maxDiscount) {
                maxDiscount = ans;
            }
        }
        discount.push(maxDiscount);
    }
    const totalDiscount = discount.reduce((sum, val) => sum + val, 0);


    const final_Amount= totalPrice+ totalTax-totalDiscount;
    let shipping_amount=50; 
    if(final_Amount > 500) shipping_amount = 0



    const address_id = await getUserAddress(user_id);
    const order_status = "completed"
    const payment_status = "completed"


    // 6. Prepare values for insert into order_master
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
    const insert = await insertValue(values);
    const orderId = insert.insertId;
    // await postOrderItems(user_id, orderId)
    // For now we return `compare` so we can see category mapping in the response
    return created(res, "Order created successfully", insert)
  } catch (err) {
    console.log(err)
    return serverError(res)
  }
}
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
export const postOrderItems = async (userId, orderId) => {

  // 1. Get cart and product/category info
  const cartItems = await getCart(userId);
  const productIds = cartItems.map((item) => item.product_id);
  console.log(productIds);
  // For each product, find its primary category
  const productCategories = await getCompareProductCategory(productIds);
  const categoryIds = productCategories.map((item) => item.category_id);

  // 2. Extract simple arrays from cart for easier calculations
  const quantities = cartItems.map((item) => item.quantity);
  const prices = cartItems.map((item) => item.price);

  // 3. Get discount percentage per category
  const discountRows = await getDiscountOnItem(categoryIds);
  const discountsPerCategory = discountRows.map((item) => ({
    category_id: item.category_id,
    discount: Number(item.discount_value),
  }));

  // For now we use a fixed order id

  // 4. Get product names
  const products = await getProducts(productIds);

  const productNames = products.map((item) => item.name);

  // 5. Hard-coded tax percent per category
  const categoryTax = {
    1: 18,
    27: 5,
  };

  // Pre-compute tax amount for each cart item
  const taxPerItem = cartItems.map((item) => {
    const matchingCategory = productCategories.find(
      (c) => c.product_id === item.product_id
    );
    const taxPercent = categoryTax[matchingCategory?.category_id] || 0;

    const taxAmount = (item.total_price * taxPercent) / 100;
    return { tax_amount: taxAmount };
  });
  // 6. Build values array for insert and response
  const values = [];

  for (let i = 0; i < cartItems.length; i++) {
    const productId = productIds[i];

    const categoryForProduct = productCategories.find(
      (c) => c.product_id === productId
    );

    const discountForCategory = discountsPerCategory.find(
      (d) => d.category_id === categoryForProduct?.category_id
    );

    const discountPercent = discountForCategory?.discount || 0;
    const discountAmount = (prices[i] * discountPercent) / 100;

    // Simple shipping rule
    let shippingAmount = 100;
    if (prices[i] > 100) shippingAmount = 0;

    const taxAmount = taxPerItem[i].tax_amount;

    const finalTotal =
      Number(prices[i]) -
      Number(discountAmount) +
      Number(taxAmount) +
      Number(shippingAmount);

    // Order of values must match insertQuery column order
    const value = [
      orderId,
      productIds[i],
      productNames[i],
      quantities[i],
      Number(prices[i]),
      discountAmount,
      taxAmount,
      finalTotal,
    ];
    values.push(value);
    // Insert single order_items row for this cart item
  }
  await insertQuery(values);
  // Return all calculated rows as the response
}
export const checkApi = async () => {
  const cart = await getCart();
  return cart;
}
const findRootCategory = async (categoryId) => {
  const query = `
  WITH RECURSIVE cat_tree AS (
      SELECT category_id, parent_id
      FROM category_master
      WHERE category_id = ?

      UNION ALL

      SELECT c.category_id, c.parent_id
      FROM category_master c
      JOIN cat_tree ct
          ON c.category_id = ct.parent_id
  )
  SELECT category_id
  FROM cat_tree
  WHERE parent_id IS NULL;
  `;

  const [rows] = await pool.query(query, [categoryId]);
  return rows[0]?.category_id;
};
const disCountOnCat = async (categoryId) => {
  const [rows] = await pool.query(`select discount_value, discount_type, category_id from offer_master where category_id= ? `, [categoryId])
  return rows;
}
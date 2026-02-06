import { getCart, getCompareProductCategory } from "../models/Order_master.model.js";
import { getProducts, getDiscount, insertQuery,Orders } from "../models/Order_items.model.js";

// Get all products that are currently in the user's cart.
// NOTE: userId is hard-coded for now; in a real app,
//       you would read this from the authenticated user.
export const Order_item = async (req, res) => {
  const userId = 2;

  // 1. Get all cart items for the user
  const cartItems = await getCart(userId);

  // 2. Collect the product ids from the cart
  const productIds = cartItems.map((item) => item.product_id);

  // 3. Fetch basic product details for those ids
  const products = await getProducts(productIds);

  // 4. Return product list in the response
  return res.status(201).json({ msg: products });
};

// Create order_items rows for each product in the user's cart,
// applying discount, tax and shipping to calculate final totals.
export const postOrderItems = async (req, res) => {
  const userId = 2;

  // 1. Get cart and product/category info
  const cartItems = await getCart(userId);
  const productIds = cartItems.map((item) => item.product_id);

  // For each product, find its primary category
  const productCategories = await getCompareProductCategory(productIds);
  const categoryIds = productCategories.map((item) => item.category_id);

  // 2. Extract simple arrays from cart for easier calculations
  const quantities = cartItems.map((item) => item.quantity);
  const prices = cartItems.map((item) => item.price);

  // 3. Get discount percentage per category
  const discountRows = await getDiscount(categoryIds);
  const discountsPerCategory = discountRows.map((item) => ({
    category_id: item.category_id,
    discount: Number(item.discount_value),
  }));

  // For now we use a fixed order id
  const orderId = req.params.orderId;

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
    await insertQuery(value);
  }

  // Return all calculated rows as the response
  return res.status(201).json({ msg: values });
}
export const getAllOrderItem=async(req,res)=>{
  
  const order_id= req.params.orderId;
  const allOrder= await Orders( order_id);
 return  res.status(200).json({msg :allOrder});
}
export const getOneItem=async(req,res)=>{
  
  const order_Id= req.params.orderId; 
  const item_Id= req.params.orderId; 
  const singleItem= await Orders( order_Id,item_Id);
 return  res.status(200).json({msg :singleItem});
}
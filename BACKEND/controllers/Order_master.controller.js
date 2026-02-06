import {
  getCart,
  getCompareProductCategory,
  getDiscount,
  getUserAddress,
  insertValue,
  getAllOrder,
  getSingleOrder

} from "../models/Order_master.model.js";

// Create an order in `order_master` based on the user's cart,
// calculating tax, discounts, shipping and final total.
export const Order_master = async (req, res) => {
  // TODO: replace hard-coded user with authenticated user id
  const user_id = 2;

  try {
    // 1. Get cart and product/category information
    const cart = await getCart(user_id);
    const productIds = cart.map((item) => item.product_id);
    const compare = await getCompareProductCategory(productIds);

    // 2. Define tax percent per category
    const categoryTax = {
      1: 18,
      27: 5,
    };

    const order_status = "completed";
    const payment_status = "completed";

    // 3. Calculate tax amount for each cart item
    const final = cart.map((item) => {
      const taxPercent =
        categoryTax[
          compare.find((c) => c.product_id === item.product_id).category_id
        ] || 0;
      const taxAmount = (item.total_price * taxPercent) / 100;
      return { tax_amount: taxAmount };
    });

    // 4. Calculate total discount across cart
    const price = cart.map((item) => item.price);
    const category_ids = compare.map((item) => item.category_id);
    const discount = await getDiscount(category_ids);

    let total_discount = 0;

    for (let i = 0; i < cart.length; i++) {
      let discountAmount = 0;

      for (let d of discount) {
        if (d.discount_type === "percentage") {
          discountAmount += (price[i] * Number(d.discount_value)) / 100;
        } else if (d.discount_type === "fixed_amount") {
          discountAmount += Number(d.discount_value);
        }
      }

      total_discount = total_discount + discountAmount;
    }

    console.log(total_discount);

    // 5. Aggregate totals (tax, subtotal, shipping, final amount)
    const totalTax = final.reduce((sum, item) => {
      return sum + Number(item.tax_amount);
    }, 0);

    const totalAmount = cart.reduce((sum, item) => {
      return sum + parseFloat(item.total_price);
    }, 0);

    let shipping_amount = 500;
    if (totalAmount > 500) shipping_amount = 0;

    const address_id = await getUserAddress(user_id);

    const final_Amount = totalAmount + totalTax - total_discount;

    // 6. Prepare values for insert into order_master
    const order_num = "ORD";

    const values = [
      order_num,
      user_id,
      address_id,
      totalAmount,
      totalTax,
      shipping_amount,
      total_discount,
      final_Amount,
      order_status,
      payment_status,
      0,
      user_id,
      user_id,
    ];

    console.log(values);

    const insert = await insertValue(values);

    // For now we return `compare` so we can see category mapping in the response
    return res.status(200).json({ msg: insert });
  } catch (err) {
    return res.status(401).json({ err: err.message });
  }
}
export const AllOrder= async(req,res)=>{
    const userId= 2; 
    const orders = await getAllOrder(userId);
    return res.status(200).json({"msg" :orders})
}
export const singleOrder= async(req,res)=>{
   const id= Number(req.params.id);
    const userId=2; 
    const order=  await getSingleOrder(userId,id);
    return res.status(200).json({"msg" :order})
}


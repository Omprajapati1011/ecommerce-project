# Cart, Orders & Offers - API Integration Guide

## Quick Reference for Developers

This document provides endpoints and schema details for integrating with the cart, order, and offer systems.

---

## Cart Endpoints

### Base URL: `/api/cart`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user's cart | Required |
| POST | `/items` | Add item to cart | Required |
| PUT | `/items/:id` | Update item quantity | Required |
| DELETE | `/items/:id` | Remove item from cart | Required |
| DELETE | `/clear` | Clear entire cart | Required |
| POST | `/offer` | Apply cart-level offer | Required |
| POST | `/items/:id/offer` | Apply product-level offer | Required |
| DELETE | `/offer` | Remove cart offer | Required |
| GET | `/offers` | Get applicable offers | Required |

### Cart Response Structure

```json
{
  "items": [
    {
      "cartItemId": 123,
      "productId": 45,
      "productName": "Product Name",
      "productImage": "url",
      "quantity": 2,
      "price": 500,
      "product_portion_id": null,
      "product_portion_name": null,
      "appliedOffer": {
        "offer_id": 1,
        "offer_name": "SAVE10",
        "discount_type": "percentage",
        "discount_value": 10,
        "discount_amount": 100
      }
    }
  ],
  "subtotal": 1000,
  "discount": 100,
  "tax": 180,
  "total": 1080,
  "appliedCartOffer": {
    "offer_id": 2,
    "offer_name": "FLAT50",
    "discount_type": "flat",
    "discount_value": 50,
    "discount_amount": 50
  }
}
```

### Add to Cart Request

```json
POST /api/cart/items
{
  "product_id": 45,
  "quantity": 2,
  "product_portion_id": null  // optional, for products with portions
}
```

---

## Order Endpoints

### Base URL: `/api/orders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/make-order` | Create order from cart | Required |
| GET | `/user-allorder` | Get user's orders | Required |
| GET | `/admin/orders` | Get all orders (paginated) | Admin |
| GET | `/admin/orders/:id` | Get order details | Admin |
| PATCH | `/changestatus/:id` | Update order status | Admin |
| PATCH | `/admin/orders/:id/payment-status` | Update payment status | Admin |
| DELETE | `/cancelorder/:id` | Cancel order | Required |

### Create Order Response

```json
POST /api/orders/make-order

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "order_id": 100,
    "order_number": "ORD2024031001",
    "total_amount": 1080,
    "order_status": "pending",
    "payment_status": "pending"
  }
}
```

### Order Response Structure

```json
{
  "order_id": 100,
  "order_number": "ORD2024031001",
  "user_id": 5,
  "total_amount": 1080,
  "subtotal": 1000,
  "tax_amount": 180,
  "discount_amount": 100,
  "order_status": "pending",
  "payment_status": "pending",
  "payment_method": null,
  "shipping_address": null,
  "created_at": "2024-03-10T10:30:00Z",
  "items": [
    {
      "product_id": 45,
      "product_name": "Product Name",
      "quantity": 2,
      "price": 500,
      "total": 1000
    }
  ]
}
```

---

## Offer Endpoints

### Base URL: `/api/offers`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all active offers | Public |
| GET | `/:id` | Get offer details | Public |
| POST | `/validate` | Validate offer code | Public |

### Offer Response Structure

```json
{
  "offer_id": 1,
  "offer_name": "SAVE10",
  "description": "10% off on orders above ₹500",
  "offer_type": "cart",  // or "product"
  "discount_type": "percentage",  // or "flat"
  "discount_value": 10,
  "min_purchase_amount": 500,
  "max_discount": 200,
  "is_active": true,
  "valid_from": "2024-01-01",
  "valid_until": "2024-12-31",
  "product_id": null  // for product-specific offers
}
```

---

## Database Schema

### Cart Table

```sql
CREATE TABLE cart (
  cart_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  product_portion_id INT,
  offer_id INT,  -- applied product offer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_master(user_id),
  FOREIGN KEY (product_id) REFERENCES product_master(product_id),
  FOREIGN KEY (offer_id) REFERENCES offer_master(offer_id)
);
```

### Order Tables

```sql
CREATE TABLE order_master (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  shipping_address TEXT,
  offer_id INT,  -- cart-level offer applied
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  item_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_portion_id INT,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  offer_id INT,  -- product-level offer applied
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES order_master(order_id)
);
```

### Offer Table

```sql
CREATE TABLE offer_master (
  offer_id INT PRIMARY KEY AUTO_INCREMENT,
  offer_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  offer_type ENUM('cart', 'product') DEFAULT 'cart',
  discount_type ENUM('percentage', 'flat') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  product_id INT,  -- for product-specific offers
  is_active TINYINT(1) DEFAULT 1,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Integration Examples

### 1. Add Product to Cart

```javascript
// Frontend
const addToCart = async (productId, quantity) => {
  const response = await api.post('/cart/items', {
    product_id: productId,
    quantity: quantity
  });
  return response.data;
};
```

### 2. Apply Offer to Cart

```javascript
// Cart-level offer
const applyCartOffer = async (offerId) => {
  const response = await api.post('/cart/offer', { offer_id: offerId });
  return response.data;
};

// Product-level offer
const applyProductOffer = async (cartItemId, offerId) => {
  const response = await api.post(`/cart/items/${cartItemId}/offer`, { 
    offer_id: offerId 
  });
  return response.data;
};
```

### 3. Create Order from Cart

```javascript
const createOrder = async () => {
  const response = await api.post('/orders/make-order');
  return response.data;
};
```

### 4. Update Order Status (Admin)

```javascript
const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/changestatus/${orderId}`, {
    status: status,
    notes: "Status updated by admin"
  });
  return response.data;
};
```

---

## Notes for Checkout Developer

1. **Cart is ready**: Use `GET /cart` to fetch cart details with all calculations done
2. **Offers are applied**: Cart response includes `appliedCartOffer` and per-item `appliedOffer`
3. **Totals calculated**: `subtotal`, `discount`, `tax`, `total` are all computed
4. **Create order**: Call `POST /orders/make-order` - it reads from cart and clears it
5. **Payment**: After order creation, implement payment flow and update `payment_status`

## Notes for Product Detail Page Developer

1. **Add to cart**: Call `POST /cart/items` with `product_id` and `quantity`
2. **Portions**: If product has portions, pass `product_portion_id`
3. **Check offers**: Call `GET /cart/offers` to show applicable offers on product page
4. **Cart badge**: Use cart response `items.length` for badge count

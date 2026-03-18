# Cart System Architecture

## Overview

The Cart System is a robust, user-centric shopping cart implementation for the e-commerce platform. It supports product variations (portions/modifiers), offer/coupon management, and comprehensive cart operations with full audit trails.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CART ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Client     │───▶│    Routes    │───▶│  Middleware  │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                   │             │
│                                                   ▼             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │    Models    │◀───│  Controller  │◀───│  Validation  │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                                               │       │
│         ▼                                               ▼       │
│  ┌──────────────┐                            ┌──────────────┐ │
│  │  Database    │                            │  Response    │ │
│  │  (MySQL)     │                            │  Handler     │ │
│  └──────────────┘                            └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

#### 1. cart_master
Primary cart table - one cart per user.

```sql
CREATE TABLE cart_master (
  cart_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  offer_id INT NULL,          -- Applied cart-level offer
  discount_amount DECIMAL(10,2) DEFAULT 0,
  is_deleted BOOLEAN DEFAULT 0,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. cart_items
Individual items in a cart with product variations.

```sql
CREATE TABLE cart_items (
  cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  product_portion_id INT NULL,  -- Size/portion selection
  modifier_id INT NULL,         -- Custom modifier (e.g., "Extra Cheese")
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- Effective price at time of add
  offer_id INT NULL,            -- Item-level offer
  is_deleted BOOLEAN DEFAULT 0,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Data Flow

### 1. Get Cart Flow
```
GET /api/cart
│
├─▶ auth middleware (verify JWT)
├─▶ validateCart middleware (get/create cart)
├─▶ getCart controller
│   ├─▶ getCartWithOffer() → Fetch cart + offer details
│   ├─▶ getCartItemsWithOffer() → Fetch items + product details
│   └─▶ buildCartResponse() → Calculate totals & discounts
│       ├─ Calculate subtotal (sum of line items)
│       ├─ Apply item-level offers
│       ├─ Apply cart-level offers
│       └─ Return formatted response
└─▶ Return cart with totals
```

### 2. Add Item to Cart Flow
```
POST /api/cart/items
Body: { productId, quantity, portionId?, modifierId? }
│
├─▶ auth middleware
├─▶ validateCart middleware
├─▶ addItemToCart controller
│   ├─▶ getProductPricing() → Get product price
│   ├─▶ findCartItem() → Check if item exists
│   ├─▶ If exists: updateCartItemQuantity() (increment)
│   └─▶ If new: insertCartItem() (create new)
├─▶ buildCartResponse() → Return updated cart
└─▶ Return success with updated cart
```

### 3. Apply Offer Flow (Cart Level)
```
POST /api/cart/offer
Body: { offer_id }
│
├─▶ auth middleware
├─▶ validateCart middleware
├─▶ applyCartOffer controller
│   ├─▶ getCartItemsWithOffer() → Calculate subtotal
│   ├─▶ Fetch offer details from offer_master
│   ├─▶ Validate offer:
│   │   ├─ Check date range (start_date, end_date)
│   │   ├─ Check time window (start_time, end_time)
│   │   ├─ Check minimum purchase amount
│   │   ├─ Check usage limit per user
│   │   └─ Check offer applicability to cart
│   ├─▶ applyOfferToCart() → Save offer_id to cart_master
│   └─▶ buildCartResponse() → Recalculate with discount
└─▶ Return updated cart with applied offer
```

### 4. Apply Offer Flow (Item Level)
```
POST /api/cart/items/:cartItemId/offer
Body: { offer_id }
│
├─▶ auth middleware
├─▶ validateCart middleware
├─▶ validateCartItemOwnership middleware
├─▶ applyCartItemOffer controller
│   ├─▶ Fetch offer details
│   ├─▶ Validate offer applicability to product
│   ├─▶ applyOfferToCartItem() → Save offer_id to cart_items
│   └─▶ buildCartResponse() → Recalculate
└─▶ Return updated cart
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get current user's cart | Yes |
| POST | `/api/cart/items` | Add item to cart | Yes |
| PATCH | `/api/cart/items/:cartItemId` | Update item quantity | Yes |
| DELETE | `/api/cart/items/:cartItemId` | Remove item from cart | Yes |
| GET | `/api/cart/offers` | Get applicable offers for cart | Yes |
| POST | `/api/cart/offer` | Apply cart-level offer | Yes |
| DELETE | `/api/cart/offer` | Remove cart-level offer | Yes |
| POST | `/api/cart/items/:cartItemId/offer` | Apply item-level offer | Yes |
| DELETE | `/api/cart/items/:cartItemId/offer` | Remove item-level offer | Yes |

## Core Functions

### Controller Functions

#### getCart(req, res)
Retrieves the current user's complete cart with calculated totals.

**Flow:**
1. Extract cart from middleware (`req.cart`)
2. Fetch cart with offer details
3. Fetch cart items with product/portion/modifier details
4. Build response with calculated discounts

**Response:**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cartId": 123,
    "items": [...],
    "subtotal": 1000.00,
    "itemDiscount": 50.00,
    "cartDiscount": 100.00,
    "discount": 150.00,
    "total": 850.00,
    "appliedCartOffer": {...}
  }
}
```

---

#### addItemToCart(req, res)
Adds a product to the cart. Handles product variations (portions, modifiers).

**Request Body:**
```json
{
  "productId": 456,
  "quantity": 2,
  "portionId": 3,      // Optional
  "modifierId": 5      // Optional
}
```

**Flow:**
1. Parse and validate input
2. Get product pricing (with portion/modifier pricing if applicable)
3. Check if same item (same product + portion + modifier) exists
4. If exists: increment quantity
5. If new: insert cart item
6. Return updated cart

**Business Rules:**
- Cannot add deleted/inactive products
- Quantity must be positive integer
- Price is stored at time of addition (for historical accuracy)

---

#### updateCartItem(req, res)
Updates quantity of a cart item. Setting quantity to 0 removes the item.

**Flow:**
1. Validate cart item ownership via middleware
2. Parse quantity
3. If quantity = 0: soft delete item
4. If quantity > 0: update quantity
5. Return updated cart

---

#### removeCartItem(req, res)
Permanently removes an item from cart (soft delete).

---

#### applyCartOffer(req, res)
Applies a cart-level offer/discount.

**Validation Checks:**
1. **Date Range:** Offer must be within start_date and end_date
2. **Time Window:** If time-based, check start_time/end_time
3. **Minimum Purchase:** Subtotal must meet min_purchase_amount
4. **Usage Limit:** Check user's usage against usage_limit_per_user
5. **Applicability:** For category/product offers, verify cart contains applicable items

**Discount Calculation:**
- **Percentage:** `(subtotal * discount_value) / 100` (capped by maximum_discount_amount)
- **Fixed Amount:** `min(discount_value, subtotal)`

---

#### applyCartItemOffer(req, res)
Applies an offer to a specific cart item.

**Validation:**
- Same date/time/usage checks as cart offer
- Additional: Verify offer applies to the specific product

---

#### getApplicableOffers(req, res)
Returns all offers applicable to the current cart.

**Returns:**
- `cartOffers`: Cart-level offers (flat_discount, first_order, time_based)
- `productOffers`: Item-level offers applicable to products in cart

---

### Model Functions

#### cart.model.js

| Function | Purpose | SQL Operation |
|----------|---------|---------------|
| `getOrCreateCartByUserId(userId)` | Get existing cart or create new | SELECT → INSERT (if not exists) |
| `getCartItemsWithProduct(cartId)` | Get items with full product details | JOIN with product_master, portion_master, modifier_master |
| `findCartItem(cartId, productId, portionId, modifierId)` | Find specific item in cart | SELECT with composite conditions |
| `insertCartItem({...})` | Add new item to cart | INSERT INTO cart_items |
| `updateCartItemQuantity(cartItemId, quantity, userId)` | Update item quantity | UPDATE cart_items |
| `deleteCartItem(cartItemId, userId)` | Soft delete item | UPDATE is_deleted = 1 |
| `getProductPricing(productId)` | Get product effective price | SELECT price/discounted_price from product_master |
| `getPortionPricing(productPortionId)` | Get portion price | SELECT from product_portion |
| `getModifierPricing(modifierId)` | Get modifier price | SELECT from modifier_master |

---

#### offer.model.js (Cart Integration)

| Function | Purpose |
|----------|---------|
| `applyOfferToCart(cartId, offerId)` | Associate offer with cart |
| `removeOfferFromCart(cartId)` | Remove offer from cart |
| `applyOfferToCartItem(cartItemId, offerId)` | Associate offer with item |
| `removeOfferFromCartItem(cartItemId)` | Remove offer from item |
| `getCartWithOffer(cartId)` | Get cart with offer details |
| `getCartItemsWithOffer(cartId)` | Get items with offer details |
| `getApplicableOffersForProduct(productId)` | Get offers for a product |
| `getApplicableCartOffers()` | Get cart-level offers |
| `getOfferUsageCount(offerId, userId)` | Check user's usage count |

---

### Middleware Functions

#### validateCart(req, res, next)
Attaches cart to `req.cart` for downstream use.

**Logic:**
```javascript
1. Extract userId from JWT token (req.user.id)
2. Query cart_master for user's active cart
3. If exists: attach to req.cart
4. If not exists: create new cart, attach to req.cart
5. Call next()
```

#### validateCartItemOwnership(req, res, next)
Verifies cart item belongs to the authenticated user.

**Logic:**
```javascript
1. Extract cartItemId from params
2. Get user's cart items
3. Check if item exists in user's cart
4. If yes: attach to req.cartItem, call next()
5. If no: return 404 error
```

---

## Offer System Integration

### Offer Types

| Type | Description | Applied To | Frontend Type |
|------|-------------|------------|---------------|
| `flat_discount` | Fixed or percentage discount on entire cart | Cart | `cart` |
| `first_order` | Special discount for first-time users | Cart | `cart` |
| `time_based` | Limited time offers | Cart | `cart` |
| `category_discount` | Discount on specific product categories | Item | `product` |
| `product_discount` | Discount on specific products | Item | `product` |

### Offer Response Structure (Updated)

The `GET /api/cart/offers` endpoint now returns offers with a `type` field for frontend filtering:

```json
{
  "success": true,
  "message": "Applicable offers fetched successfully",
  "data": {
    "cartOffers": [
      {
        "offer_id": 1,
        "offer_name": "WEEKEND10",
        "offer_type": "flat_discount",
        "discount_type": "percentage",
        "discount_value": 10,
        "min_purchase_amount": 500,
        "type": "cart"
      }
    ],
    "productOffers": [
      {
        "offer_id": 2,
        "offer_name": "PRODUCT20",
        "offer_type": "product_discount",
        "discount_type": "percentage",
        "discount_value": 20,
        "product_id": 456,
        "type": "product"
      }
    ]
  }
}
```

### One Offer Per Product Rule

**Business Rule:** Only one offer can be applied to a single product at a time.

**Implementation:**
- Backend: `applyCartItemOffer` checks if offer is applicable to the specific product
- Frontend: Shows warning if user tries to apply another offer when one is already applied
- UI: "Remove" button appears on applied offers to allow switching offers

### Frontend Offer States

| State | Visual | Action |
|-------|--------|--------|
| **Product Offer - Available** | Amber background, clickable | Click to apply |
| **Product Offer - Applied** | Green background, checkmark | Shows "Remove" button |
| **Cart Offer - Unlocked** | Grey hoverable, ticket icon | Click to apply |
| **Cart Offer - Locked** | Faded grey, lock icon | Shows min. order requirement |
| **Cart Offer - Applied** | Green background, checkmark | Shows "Remove" button |

### Cart Offer Locking Logic

Cart offers are **locked** (not clickable) when:
```javascript
cart.subtotal < offer.min_purchase_amount
```

Locked offers display:
- Lock icon (🔒)
- Faded appearance
- "Min. order ₹X" message

### Discount Hierarchy

```
Cart Total Calculation:
│
├─▶ Subtotal (sum of all line items)
│   └─▶ Each item: quantity × effective_price
│
├─▶ Item-Level Discounts (applied first)
│   └─▶ Sum of all item discounts
│
├─▶ Cart-Level Discount (applied to remaining subtotal)
│   └─▶ Percentage or fixed amount
│
└─▶ Final Total = Subtotal - Item Discounts - Cart Discount
```

### Offer Validation Rules

1. **Active & Not Deleted:** `is_active = 1 AND is_deleted = 0`
2. **Date Range:** `CURRENT_DATE BETWEEN start_date AND end_date`
3. **Time Window:** If specified, `CURRENT_TIME BETWEEN start_time AND end_time`
4. **Minimum Purchase:** `subtotal >= min_purchase_amount`
5. **Usage Limit:** `user_usage_count < usage_limit_per_user`
6. **Product/Category Match:** For item offers, product must be in offer's category/product list

---

## Response Builder

### buildCartResponse(cartId, items, cartOffer)

Transforms raw database results into a structured cart response.

**Steps:**

1. **Process Items:**
   ```javascript
   items.map(item => {
     // Calculate line total
     lineTotal = item.effective_price × item.quantity
     
     // Apply item-level offer
     if (item.item_offer_id) {
       itemDiscount = calculateDiscount(itemOffer, lineTotal)
     }
     
     return {
       cartItemId, productId, productName, quantity,
       price, lineTotal, appliedOffer, discountedLineTotal
     }
   })
   ```

2. **Calculate Cart-Level Discount:**
   ```javascript
   if (cartOffer && subtotal >= min_purchase_amount) {
     cartDiscount = calculateDiscount(cartOffer, subtotal)
   }
   ```

3. **Compute Totals:**
   ```javascript
   totalDiscount = itemDiscountSum + cartDiscount
   total = subtotal - totalDiscount
   ```

4. **Return Structured Response:**
   ```json
   {
     cartId,
     items: [...],
     subtotal,
     itemDiscount,
     cartDiscount,
     discount,
     total,
     appliedCartOffer
   }
   ```

---

## Security & Validation

### Authentication
- All cart endpoints require JWT authentication
- User ID extracted from JWT token (`req.user.id`)
- No user ID in URL parameters (prevents cart hijacking)

### Authorization
- `validateCart`: Ensures cart belongs to authenticated user
- `validateCartItemOwnership`: Ensures item belongs to user's cart
- Soft deletes only: Historical data preserved

### Input Validation
- `parsePositiveInt()`: Ensures valid positive integers
- Required fields: productId, quantity
- Optional fields: portionId, modifierId
- Invalid inputs return 400 Bad Request

---

## Error Handling

| Error Scenario | HTTP Status | Response |
|----------------|-------------|----------|
| Unauthorized | 401 | `{ success: false, message: "Authentication required" }` |
| Cart not found | 404 | `{ success: false, message: "Cart not found" }` |
| Item not found | 404 | `{ success: false, message: "Cart item not found" }` |
| Invalid quantity | 400 | `{ success: false, message: "Invalid quantity" }` |
| Offer not found | 400 | `{ success: false, message: "Offer not found or not active" }` |
| Offer expired | 400 | `{ success: false, message: "Offer is not currently valid" }` |
| Min purchase not met | 400 | `{ success: false, message: "Minimum purchase amount is X" }` |
| Usage limit exceeded | 400 | `{ success: false, message: "Offer usage limit exceeded" }` |
| Server error | 500 | `{ success: false, message: "Internal server error" }` |

---

## Audit Trail

Every cart operation tracks:
- `created_by`: User who created the record
- `updated_by`: User who last updated
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `is_deleted`: Soft delete flag (0 = active, 1 = deleted)

---

## Future Enhancements

1. **Cart Persistence for Guests:** Session-based carts for non-logged users
2. **Cart Abandonment Recovery:** Email reminders for abandoned carts
3. **Inventory Check:** Real-time stock validation before checkout
4. **Cart Sharing:** Share cart via link/email
5. **Save for Later:** Move items to wishlist/saved list
6. **Multi-Currency:** Support for different currencies with conversion
7. **Cart Analytics:** Track cart abandonment rates, average cart value

---

## Usage Examples

### Add Item to Cart
```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 456,
    "quantity": 2,
    "portionId": 3,
    "modifierId": 5
  }'
```

### Apply Offer to Cart
```bash
curl -X POST http://localhost:5000/api/cart/offer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 789
  }'
```

### Update Item Quantity
```bash
curl -X PATCH http://localhost:5000/api/cart/items/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

---

## Related Documentation

- [Offer System](./OFFER_README.md)
- [Product System](./PRODUCT_README.md)
- [Order System](./ORDER_README.md)
- [Authentication](./AUTH_README.md)

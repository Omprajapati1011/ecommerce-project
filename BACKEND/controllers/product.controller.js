import db from "../configs/db.js";
import Product from "../models/product.model.js";

export const createProduct = async (req, res) => {
  const conn = await db.getConnection();
      const USER_ID = 1; // admin / system user (temporary) 

  try {
    await conn.beginTransaction();

    // 1️. Insert product
    const [result] = await Product.create({
      ...req.body,
    //    created_by: req.user.user_id
        created_by: USER_ID

    }, conn);

    const productId = result.insertId;

    // 2️. Handle category hierarchy
    if (req.body.category_id) {
      const [rows] = await Product.getCategoryWithParents(
        req.body.category_id,
        conn
      );

      const categoryIds = rows.map(r => r.category_id);

      await Product.insertProductCategories(
        productId,
        categoryIds,
        conn
      );
    }

    await conn.commit();

    res.status(201).json({
      message: "Product created successfully",
      product_id: productId
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({
      message: "Error creating product",
      error: err.message
    });
  } finally {
    conn.release();
  }
};

/* =========================
   Soft Delete Product
========================= */
export const deleteProduct = async (req, res) => {
  const USER_ID = 1; // TEMP (replace with JWT later)

  try {
    const { id } = req.params;

    const [result] = await Product.softDelete(id, USER_ID);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found or already deleted"
      });
    }

    res.json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    res.status (500).json({
      message: "Error deleting product",
      error: err.message
    });
  }
};

/* =========================
  Get All Products
========================= */
export const getAllProducts = async (req, res) => {
  try {
    const [products] = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
  Get Product By ID
========================= */
export const getProductById = async (req, res) => {
  try {
    const [rows] = await Product.findById(req.params.id);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
  Update Product
========================= */
export const updateProduct = async (req, res) => {
  const USER_ID = 1;

  try {
    await Product.update(req.params.id, {
      ...req.body,
      updated_by: USER_ID
    });

    res.json({ message: "Product updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
  Update Product Status
========================= */

export const updateProductStatus = async (req, res) => {
  try {
    await Product.updateStatus(req.params.id, req.body.is_active);
    res.json({ message: 'Product status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import db from "../configs/db.js";
import Product, { findBestSellers } from "../models/product.model.js";
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
} from "../utils/apiResponse.js";

export const createProduct = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Validate category existence
    if (req.body.category_id) {
      const exists = await Product.checkCategoryExists(
        req.body.category_id,
        conn,
      );

      if (!exists) {
        await conn.rollback();
        return res.status(400).json({
          message: "Invalid category_id",
        });
      }
    }
    // Insert product
    const [result] = await Product.create(
      {
        ...req.body,
        created_by: req.user.id,
      },
      conn,
    );

    const productId = result.insertId;

    // Handle category hierarchy
    if (req.body.category_id) {
      const [rows] = await Product.getCategoryWithParents(
        req.body.category_id,
        conn,
      );

      const categoryIds = rows.map((r) => r.category_id);

      await Product.insertProductCategories(
        productId,
        categoryIds,
        req.user.id,
        conn,
      );
    }

    await conn.commit();

    return created(res, "Product created successfully", {
      product_id: productId,
    });
  } catch (err) {
    await conn.rollback();
    return serverError(res, err.message);
  } finally {
    conn.release();
  }
};

//  Soft Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await Product.softDelete(id, req.user.id);

    if (result.affectedRows === 0) {
      return notFound(res, "Product not found or already deleted");
    }

    return ok(res, "Product deleted successfully");
  } catch (err) {
    return serverError(res, err.message);
  }
};

// Get All Products
export const getAllProducts = async (req, res) => {
  try {
    const filters = {
      category_id: req.query.category_id
        ? Number(req.query.category_id)
        : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      search: req.query.search,
      is_active:
        req.query.is_active !== undefined
          ? Number(req.query.is_active)
          : undefined,
    };

    // Pagination parsing
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // Sorting
    const sortField = req.query.sortField || null;
    const sortOrder = req.query.sortOrder || "asc";

    const { total, data, totalAll, totalActive } = await Product.findAll(
      filters,
      { limit, offset, sortField, sortOrder },
    );

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      stats: {
        totalAll: Number(totalAll),
        totalActive: Number(totalActive),
      },
      data,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};

// Get Product By ID
export const getProductById = async (req, res) => {
  try {
    const [rows] = await Product.findById(req.params.id);

    if (rows.length === 0) {
      return notFound(res, "Product not found");
    }

    return ok(res, "Product fetched successfully", rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    // Fetch existing product to detect category change
    const [existingRows] = await Product.findById(req.params.id);

    if (existingRows.length === 0) {
      return notFound(res, "Product not found");
    }

    const existingProduct = existingRows[0];

    // If category_id not provided or unchanged, do a simple update
    if (
      !Object.prototype.hasOwnProperty.call(req.body, "category_id") ||
      Number(req.body.category_id) === Number(existingProduct.category_id)
    ) {
      const [result] = await Product.update(req.params.id, {
        ...req.body,
        updated_by: req.user.id,
      });

      if (!result || result.affectedRows === 0) {
        return notFound(res, "Product not found or already deleted");
      }

      return ok(res, "Product updated successfully");
    }

    // Category changed: validate and perform transactional update
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // Validate new category exists
      const newCategoryId = req.body.category_id;
      const categoryExists = await Product.checkCategoryExists(
        newCategoryId,
        conn,
      );

      if (!categoryExists) {
        await conn.rollback();
        return notFound(res, "Category not found");
      }

      // Update product row (preserve updated_by)
      const [updateResult] = await Product.update(
        req.params.id,
        {
          ...req.body,
          updated_by: req.user.id,
        },
        conn,
      );

      if (!updateResult || updateResult.affectedRows === 0) {
        await conn.rollback();
        return notFound(res, "Product not found or already deleted");
      }

      // Remove old product_categories rows
      await conn.execute(
        `DELETE FROM product_categories WHERE product_id = ?`,
        [req.params.id],
      );

      // Build ancestor chain and insert new product_categories
      const [rows] = await Product.getCategoryWithParents(newCategoryId, conn);
      const categoryIds = rows.map((r) => r.category_id);

      await Product.insertProductCategories(
        req.params.id,
        categoryIds,
        req.user.id,
        conn,
      );

      await conn.commit();

      return ok(res, "Product updated successfully");
    } catch (err) {
      await conn.rollback();
      return serverError(res, err.message);
    } finally {
      conn.release();
    }
  } catch (err) {
    return serverError(res, err.message);
  }
};

// Update Product Status

export const updateProductStatus = async (req, res) => {
  try {
    const [result] = await Product.updateStatus(
      req.params.id,
      req.body.is_active,
      req.user.id,
    );
    if (result.affectedRows === 0) {
      return notFound(res, "Product not found or already deleted");
    }

    return ok(res, "Product updated successfully");
  } catch (err) {
    return serverError(res, err.message);
  }
};

// Get Best Sellers
export const getBestSellers = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 8);
    const [rows] = await findBestSellers(limit);
    return ok(res, "Best sellers fetched successfully", {
      count: rows.length,
      items: rows,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};

import * as Category from "../models/category.model.js";
import { buildCategoryTree, countTreeNodes } from "../utils/categoryTree.js";

import {
  ok,
  created,
  notFound,
  conflict,
  badRequest,
  serverError,
  paginated,
} from "../utils/apiResponse.js";

/*
=====================================
GET ALL
=====================================
*/

export const getAllcategory = async (req, res) => {
  try {
    const hasQueryParams = Object.keys(req.query || {}).length > 0;

    // Plain GET /categories -> return all (no pagination)
    if (!hasQueryParams) {
      const [categories] = await Category.getAll();
      return ok(res, "Categories fetched successfully", {
        count: categories.length,
        items: categories,
      });
    }

    let { name, page, limit } = req.validated.query;
    name = (name || "").trim();

    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 5;
    const offset = (currentPage - 1) * perPage;

    // If name is empty but pagination params are provided -> paginate all
    if (name === "") {
      const [allCategories] = await Category.getAll();
      const total = Number(allCategories.length) || 0;

      const paginatedData = allCategories.slice(offset, offset + perPage);

      return paginated(
        res,
        "Categories fetched successfully",
        {
          page: currentPage,
          limit: perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
        paginatedData,
      );
    }

    const [countRows] = await Category.countByName(name);
    const total = Number(countRows?.[0]?.total ?? 0);

    const [categories] = await Category.searchByName(name, perPage, offset);

    return paginated(
      res,
      "Search result fetched successfully",
      {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      categories,
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const [rows] = await Category.getAllForTree();

    if (!rows.length) {
      return ok(res, "Category tree fetched successfully", {
        count: 0,
        items: [],
      });
    }

    const tree = buildCategoryTree(rows);

    return ok(res, "Category tree fetched successfully", {
      count: countTreeNodes(tree),
      items: tree,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
GET BY ID (TREE)
=====================================
*/
export const getCategoryById = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const [categories] = await Category.getById(categoryId);

    if (!categories.length) {
      return notFound(res, "Category not found");
    }

    const tree = buildCategoryTree(categories);
    const totalNodes = countTreeNodes(tree);

    return ok(res, "Category fetched successfully", {
      count: totalNodes,
      item: tree[0],
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
GET MULTIPLE BY IDS
=====================================
*/
export const getCategoriesByIds = async (req, res) => {
  try {
    const { ids } = req.validated.query;

    const [categories] = await Category.getByIds(ids);

    const positionById = new Map(ids.map((id, idx) => [id, idx]));
    const sortedCategories = [...categories].sort(
      (a, b) =>
        (positionById.get(Number(a.category_id)) ?? Number.MAX_SAFE_INTEGER) -
        (positionById.get(Number(b.category_id)) ?? Number.MAX_SAFE_INTEGER),
    );

    const foundIds = new Set(
      sortedCategories.map((item) => Number(item.category_id)),
    );
    const missingIds = ids.filter((id) => !foundIds.has(id));

    return ok(res, "Categories fetched successfully", {
      requestedCount: ids.length,
      foundCount: sortedCategories.length,
      missingIds,
      items: sortedCategories,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
GET PRODUCTS
=====================================
*/
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const hasQueryParams = Object.keys(req.query || {}).length > 0;

    // Plain GET /categories/:id/products -> return all (no pagination)
    if (!hasQueryParams) {
      const [products] = await Category.getByCategory(categoryId);
      return ok(res, "Products fetched successfully", {
        count: products.length,
        items: products,
      });
    }

    let { page, limit, search } = req.query;
    search = (search || "").trim();

    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 5;
    const offset = (currentPage - 1) * perPage;

    // Get all products for the category
    const [allProducts] = await Category.getByCategory(categoryId);

    // Filter by search term if provided
    let filteredProducts = allProducts;
    if (search) {
      const normalizedSearch = String(search)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const compactSearch = normalizedSearch.replace(/\s+/g, "");

      filteredProducts = allProducts.filter((product) => {
        const source = String(
          `${product.product_name || ""} ${product.name || ""} ${product.display_name || ""} ${product.description || ""}`,
        )
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const compactSource = source.replace(/\s+/g, "");

        return (
          source.includes(normalizedSearch) ||
          compactSource.includes(compactSearch)
        );
      });
    }

    const total = filteredProducts.length;
    const paginatedData = filteredProducts.slice(offset, offset + perPage);

    return paginated(
      res,
      "Products fetched successfully",
      {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      paginatedData,
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

export const getProductsByCategories = async (req, res) => {
  try {
    const { ids, page, limit } = req.validated.query;
    const hasPaging = page !== undefined || limit !== undefined;
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 8;
    const offset = (currentPage - 1) * perPage;

    if (!hasPaging) {
      const [products] = await Category.getProductsByCategoryIds(ids);
      return ok(res, "Products fetched successfully", {
        count: products.length,
        items: products,
      });
    }

    const [countRows] = await Category.countProductsByCategoryIds(ids);
    const total = Number(countRows?.[0]?.total ?? 0);

    if (total === 0) {
      return paginated(
        res,
        "Products fetched successfully",
        {
          page: currentPage,
          limit: perPage,
          total: 0,
          totalPages: 0,
        },
        [],
      );
    }

    const [products] = await Category.getProductsByCategoryIdsPaginated(
      ids,
      perPage,
      offset,
    );

    return paginated(
      res,
      "Products fetched successfully",
      {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      products,
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

const resolveCategoryFilters = (query = {}) => {
  let parentIds = Array.isArray(query.parent_ids) ? query.parent_ids : [];
  let childIds = Array.isArray(query.child_ids) ? query.child_ids : [];

  if (!parentIds.length && !childIds.length && Array.isArray(query.ids)) {
    parentIds = query.ids;
  }

  return { parentIds, childIds };
};

const resolveFilterSource = (req) =>
  req.validated?.body ?? req.validated?.query ?? req.query ?? {};

export const getProductsByCategoryFilters = async (req, res) => {
  try {
    const filterSource = resolveFilterSource(req);
    const { page, limit, search, min_price, max_price } = filterSource;
    const { parentIds, childIds } = resolveCategoryFilters(filterSource);

    const hasPaging = page !== undefined || limit !== undefined;
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 8;
    const offset = (currentPage - 1) * perPage;

    if (!hasPaging) {
      const [products] = await Category.getProductsByCategoryFilter(
        parentIds,
        childIds,
        search,
        min_price,
        max_price,
      );
      return ok(res, "Products fetched successfully", {
        count: products.length,
        items: products,
      });
    }

    const [countRows] = await Category.countProductsByCategoryFilter(
      parentIds,
      childIds,
      search,
      min_price,
      max_price,
    );
    const total = Number(countRows?.[0]?.total ?? 0);

    if (total === 0) {
      return paginated(
        res,
        "Products fetched successfully",
        {
          page: currentPage,
          limit: perPage,
          total: 0,
          totalPages: 0,
        },
        [],
      );
    }

    const [products] = await Category.getProductsByCategoryFilterPaginated(
      parentIds,
      childIds,
      search,
      min_price,
      max_price,
      perPage,
      offset,
    );

    return paginated(
      res,
      "Products fetched successfully",
      {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      products,
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

export const getProductsPriceRangeByFilters = async (req, res) => {
  try {
    const filterSource = resolveFilterSource(req);
    const { search } = filterSource;
    const { parentIds, childIds } = resolveCategoryFilters(filterSource);

    const [rows] = await Category.getProductsPriceRangeByCategoryFilter(
      parentIds,
      childIds,
      search,
    );

    const minPrice = Number(rows?.[0]?.min_price ?? 0);
    const maxPrice = Number(rows?.[0]?.max_price ?? 0);

    return ok(res, "Price range fetched successfully", {
      min: Number.isFinite(minPrice) ? minPrice : 0,
      max: Number.isFinite(maxPrice) ? maxPrice : 0,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
SEARCH (PAGINATED)
=====================================
*/
export const searchCategory = async (req, res) => {
  try {
    const { name, page, limit } = req.query;

    const offset = (page - 1) * limit;

    const [rows] = await Category.countByName(name);
    const total = rows?.[0]?.total ?? 0;

    const [categories] = await Category.searchByName(name, limit, offset);

    return paginated(
      res,
      "Categories fetched successfully",
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categories,
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
CREATE
=====================================
*/
export const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const userId = req.user.id;

    const [exists] = await Category.findByName(name);

    if (exists.length) {
      return conflict(res, "Category already exists");
    }

    if (parent_id) {
      const [parent] = await Category.findById(parent_id);

      if (!parent.length) {
        return notFound(res, "Parent category not found");
      }
    }

    const [result] = await Category.create(name, parent_id, userId);

    return created(res, "Category created successfully", {
      category_id: result.insertId,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
UPDATE
=====================================
*/
export const updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const { name, parent_id } = req.body;
    const userId = req.user.id;

    const [exists] = await Category.findById(categoryId);
    if (!exists.length) return notFound(res, "Category not found");

    const current = exists[0];

    if (name === undefined && parent_id === undefined)
      return badRequest(res, "Nothing to update");

    const finalName = name ?? current.category_name;

    const finalParent =
      parent_id === undefined
        ? current.parent_id
        : parent_id === null
          ? null
          : Number(parent_id);

    // no change
    if (
      finalName === current.category_name &&
      Number(finalParent ?? 0) === Number(current.parent_id ?? 0)
    ) {
      return ok(res, "No changes detected");
    }

    // duplicate name
    if (name !== undefined) {
      const [duplicate] = await Category.findByName(finalName);
      if (duplicate.length && Number(duplicate[0].category_id) !== categoryId) {
        return conflict(res, "Category already exists");
      }
    }

    if (parent_id !== undefined && finalParent !== null) {
      // ❌ self parent
      if (finalParent === categoryId)
        return badRequest(res, "Category cannot be its own parent");

      // ❌ parent must exist
      const [parent] = await Category.findById(finalParent);
      if (!parent.length) return notFound(res, "Parent category not found");

      // 🔥🔥🔥 circular check (USE YOUR EXISTING FUNCTION)
      const [children] = await Category.getChildrenIdsOnly(categoryId);

      const childIds = children.map((c) => Number(c.category_id));

      if (childIds.includes(finalParent)) {
        return badRequest(res, "Circular hierarchy not allowed");
      }
    }

    const [result] = await Category.update(
      categoryId,
      finalName,
      finalParent,
      userId,
    );

    return ok(res, "Category updated successfully", {
      affected: result.affectedRows,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
DELETE
=====================================
*/
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const userId = req.user.id;

    const [exists] = await Category.findById(categoryId);
    if (!exists.length) return notFound(res, "Category not found");

    const [result] = await Category.softDeleteSubtree(categoryId, userId);

    if (!result.affectedRows) {
      return ok(res, "Already deleted");
    }

    return ok(res, "Category subtree deleted successfully", {
      affected: result.affectedRows,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
UPDATE STATUS
=====================================
*/
export const updateCategoryStatus = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const userId = req.user.id;
    const { is_active } = req.body;

    if (is_active === undefined)
      return badRequest(res, "is_active is required");

    const isActive = Number(is_active) === 1 ? 1 : 0;

    const [exists] = await Category.findById(categoryId);
    if (!exists.length) return notFound(res, "Category not found");

    const [result] = await Category.toggleStatusSubtree(
      categoryId,
      isActive,
      userId,
    );

    if (!result.affectedRows) {
      return ok(res, "No changes made");
    }

    return ok(
      res,
      `Category ${isActive ? "activated" : "deactivated"} successfully`,
      {
        affected: result.affectedRows,
      },
    );
  } catch (error) {
    return serverError(res, error.message);
  }
};

/*
=====================================
RESTORE
=====================================
*/
export const restoreCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const userId = req.user.id;

    const [result] = await Category.restoreSubtree(categoryId, userId);

    if (!result.affectedRows) {
      return notFound(res, "Category not found or already active");
    }

    return ok(res, "Category subtree restored successfully", {
      affected: result.affectedRows,
    });
  } catch (error) {
    return serverError(res, error.message);
  }
};

const categoryController = {
  getAllcategory,
  getCategoriesByIds,
  getCategoryById,
  getCategoryTree,
  getProductsByCategory,
  getProductsByCategories,
  getProductsByCategoryFilters,
  getProductsPriceRangeByFilters,
  searchCategory,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
  restoreCategory,
};
export default categoryController;

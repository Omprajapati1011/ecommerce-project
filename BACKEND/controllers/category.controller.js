// import * as Category from "../models/category.model.js";
// import buildCategoryTree from "../utils/categoryTree.js";
// import {
//   ok,
//   created,
//   notFound,
//   conflict,
//   badRequest,
//   serverError,
//   paginated,
// } from "../utils/apiResponse.js";

// export const getAllcategory = async (req, res) => {
//   try {
//     const [categories] = await Category.getAll();
//     return res.json({ success: true, count: categories.length, categories });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const getCategoryById = async (req, res) => {
//   try {
//     const categoryId = req.params.id;
//     const [categories] = await Category.getById(categoryId);
//     if (categories.length === 0) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     const tree = buildCategoryTree(categories);

//     return res.json({
//       success: true,
//       count: categories.length,
//       categories: tree[0],
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const getProductsByCategory = async (req, res) => {
//   try {
//     const categoryId = req.params.id;
//     const [products] = await Category.getByCategory(categoryId);
//     return res.json({ success: true, count: products.length, data: products });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const searchCategory = async (req, res) => {
//   try {
//     const { name, page, limit } = req.query;

//     const offset = (page - 1) * limit;

//     const [rows] = await Category.countByName(name);
//     const total = rows?.[0]?.total ?? 0;

//     if (total === 0) {
//       return res.json({
//         success: true,
//         page,
//         limit,
//         totalRecords: 0,
//         totalPages: 0,
//         count: 0,
//         data: [],
//       });
//     }

//     const [categories] = await Category.searchByName(name, limit, offset);

//     return res.json({
//       success: true,
//       page,
//       limit,
//       totalRecords: total,
//       totalPages: Math.ceil(total / limit),
//       count: categories.length,
//       data: categories,
//     });
//   } catch (error) {
//     console.error("SEARCH ERROR =>", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const createCategory = async (req, res) => {
//   try {
//     const { name, parent_id } = req.body;
//     const userId = req.user.user_id; // from auth middleware

//     // 2. Check duplicate
//     const [exists] = await Category.findByName(name);
//     if (exists.length > 0) {
//       return res
//         .status(409)
//         .json({ success: false, message: "Category already exists" });
//     }

//     // 3. Validate parent
//     if (parent_id !== undefined && parent_id !== null) {
//       const [parent] = await Category.findById(parent_id);
//       if (parent.length === 0) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Parent category not found" });
//       }
//     }

//     // 4. Insert
//     const [result] = await Category.create(name, parent_id, userId);

//     return res.status(201).json({
//       success: true,
//       message: "Category created",
//       category_id: result.insertId,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // export const updateCategory = async (req, res) => {
// //   try {
// //     const categoryId = req.params.id;
// //     const { name, parent_id } = req.body;
// //     const userId = req.user.user_id;

// //     // 1. validation
// //     if (!name) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Category name required" });
// //     }

// //     // 2. check exists
// //     const [exists] = await Category.findById(categoryId);
// //     if (!exists.length) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "Category not found" });
// //     }

// //     // 3. duplicate name check
// //     const [duplicate] = await Category.findByName(name);
// //     if (duplicate.length && duplicate[0].category_id != categoryId) {
// //       return res
// //         .status(409)
// //         .json({ success: false, message: "Category already exists" });
// //     }

// //     // 4. validate parent (optional)
// //     if (parent_id) {
// //       const [parent] = await Category.findById(parent_id);
// //       if (!parent.length) {
// //         return res
// //           .status(404)
// //           .json({ success: false, message: "Parent category not found" });
// //       }
// //     }

// //     // 5️⃣ circular validation

// //     // self parent check
// //     if (Number(parent_id) === Number(categoryId)) {
// //       return res.status(400).json({
// //         message: "Category cannot be its own parent",
// //       });
// //     }

// //     // descendant check
// //     if (parent_id) {
// //       const [children] = await Category.getChildrenIdsOnly(categoryId);

// //       const childIds = children.map((c) => c.category_id);

// //       if (childIds.includes(Number(parent_id))) {
// //         return res.status(400).json({
// //           message: "Circular hierarchy not allowed",
// //         });
// //       }
// //     }

// //     // 6. update
// //     await Category.update(categoryId, name, parent_id, userId);

// //     res.json({
// //       success: true,
// //       message: "Category updated successfully",
// //     });
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// export const updateCategory = async (req, res) => {
//   try {
//     const categoryId = Number(req.params.id); // ⭐ FIX 1
//     const { name, parent_id } = req.body;
//     const userId = req.user.user_id;

//     // 1️⃣ exists
//     const [exists] = await Category.findById(categoryId);

//     if (!exists.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     const current = exists[0];

//     // 2️⃣ nothing provided
//     if (name === undefined && parent_id === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "Nothing to update",
//       });
//     }

//     // 3️⃣ final values
//     const finalName = name !== undefined ? name : current.category_name;

//     const finalParent =
//       parent_id !== undefined
//         ? parent_id === null
//           ? null
//           : Number(parent_id)
//         : current.parent_id;

//     // 4️⃣ no change
//     if (
//       finalName === current.category_name &&
//       Number(finalParent ?? 0) === Number(current.parent_id ?? 0)
//     ) {
//       return res.status(200).json({
//         success: true,
//         message: "No changes detected",
//       });
//     }

//     // 5️⃣ duplicate name
//     if (name !== undefined) {
//       const [duplicate] = await Category.findByName(finalName);

//       if (duplicate.length && Number(duplicate[0].category_id) !== categoryId) {
//         return res.status(409).json({
//           success: false,
//           message: "Category already exists",
//         });
//       }
//     }

//     // 6️⃣ parent validations
//     if (parent_id !== undefined && finalParent !== null) {
//       // self parent
//       if (finalParent === categoryId) {
//         return res.status(400).json({
//           success: false,
//           message: "Category cannot be its own parent",
//         });
//       }

//       // parent exists
//       const [parent] = await Category.findById(finalParent);

//       if (!parent.length) {
//         return res.status(404).json({
//           success: false,
//           message: "Parent category not found",
//         });
//       }

//       // circular
//       const [children] = await Category.getChildrenIdsOnly(categoryId);
//       const childIds = children.map((c) => Number(c.category_id));

//       if (childIds.includes(finalParent)) {
//         return res.status(400).json({
//           success: false,
//           message: "Circular hierarchy not allowed",
//         });
//       }
//     }

//     // 7️⃣ update
//     const [result] = await Category.update(
//       categoryId,
//       finalName,
//       finalParent,
//       userId,
//     );

//     return res.json({
//       success: true,
//       message: "Category updated successfully",
//       affected: result.affectedRows,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const deleteCategory = async (req, res) => {
//   try {
//     const categoryId = Number(req.params.id);
//     const userId = req.user.user_id;

//     // 1️⃣ check exists
//     const [exists] = await Category.findById(categoryId);

//     if (!exists.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     // 2️⃣ soft delete subtree
//     const [result] = await Category.softDeleteSubtree(categoryId, userId);

//     if (result.affectedRows === 0) {
//       return res.json({
//         success: false,
//         message: "Already deleted",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Category subtree deleted successfully",
//       affected: result.affectedRows,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const restoreCategory = async (req, res) => {
//   try {
//     const categoryId = Number(req.params.id);
//     const userId = req.user.user_id;

//     const [result] = await Category.restoreSubtree(categoryId, userId);

//     // nothing restored
//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found or already active",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Category subtree restored successfully",
//       affected: result.affectedRows,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const categoryController = {
//   getAllcategory,
//   getCategoryById,
//   getProductsByCategory,
//   searchCategory,
//   createCategory,
//   updateCategory,
//   deleteCategory,
//   restoreCategory,
// };
// export default categoryController;

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
    const [categories] = await Category.getAll();
    if (!categories.length) {
      return notFound(res, "Category not found");
    }

    const tree = buildCategoryTree(categories);
    const totalNodes = countTreeNodes(tree);

    return ok(res, "categories fetched successfully", {
      count: totalNodes,
      item: tree[0],
    });

    // return ok(res, "Categories fetched successfully", {
    //   count: categories.length,
    //   items: categories,
    // });
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
GET PRODUCTS
=====================================
*/
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const [products] = await Category.getByCategory(categoryId);

    return ok(res, "Products fetched successfully", {
      count: products.length,
      items: products,
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
    // console.log("CREATE CATEGORY =>", { name, parent_id, userId });
    // console.log("req.user:", req.user);
    // console.log("userId:", req.user?.user_id);

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
  getCategoryById,
  getProductsByCategory,
  searchCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
};
export default categoryController;

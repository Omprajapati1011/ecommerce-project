import db from "../configs/db.js";
import cloudinary from "../configs/cloudinary.js";
import {
  clearPrimaryByProductId,
  createProductImage,
  findModifierPortion,
  findProductById,
  findProductPortion,
  getImageById,
  getProductImagesByProductId,
  getVariantImageWithPriority,
  setPrimaryByImageId,
  softDeleteImageById,
  updateProductImageById,
} from "../models/productImage.model.js";
import { badRequest, created, notFound, ok, serverError } from "../utils/apiResponse.js";

// Normalize user id from supported JWT payload keys.
const getUserId = (req) => {
  const userId = req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;
  const parsed = Number(userId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// Upload in-memory multer file buffer to Cloudinary.
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

// POST /api/product-images/upload
export const uploadProductImageController = async (req, res) => {
  try {
    if (!req.file) {
      return badRequest(res, "image file is required");
    }

    const userId = getUserId(req);
    const {
      product_id,
      image_level,
      product_portion_id,
      modifier_portion_id,
      is_primary,
    } = req.validated?.body ?? req.body;

    const product = await findProductById(product_id);
    if (!product) {
      return notFound(res, "Product not found");
    }

    if (product_portion_id) {
      const portion = await findProductPortion(product_portion_id, product_id);
      if (!portion) {
        return badRequest(res, "product_portion_id is not linked with product_id");
      }
    }

    if (modifier_portion_id) {
      const modifierPortion = await findModifierPortion(modifier_portion_id);
      if (!modifierPortion) {
        return badRequest(res, "modifier_portion_id does not exist");
      }

      if (Number(modifierPortion.product_id) !== Number(product_id)) {
        return badRequest(res, "modifier_portion_id is not linked with product_id");
      }

      if (
        image_level === "VARIANT" &&
        Number(modifierPortion.product_portion_id) !== Number(product_portion_id)
      ) {
        return badRequest(res, "modifier_portion_id is not linked with product_portion_id");
      }
    }

    const folder = `products/product_${product_id}/${image_level.toLowerCase()}`;
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, folder);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (Number(is_primary) === 1) {
        await clearPrimaryByProductId(product_id, userId, conn);
      }

      const imageId = await createProductImage(
        {
          product_id,
          product_portion_id: product_portion_id ?? null,
          modifier_portion_id: modifier_portion_id ?? null,
          image_level,
          image_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          is_primary: Number(is_primary) === 1 ? 1 : 0,
          created_by: userId,
          updated_by: userId,
        },
        conn,
      );

      await conn.commit();

      const image = await getImageById(imageId);
      return created(res, "Image uploaded successfully", image);
    } catch (error) {
      await conn.rollback();

      if (uploadResult?.public_id) {
        try {
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: "image" });
        } catch (cleanupError) {
          console.error("Cloudinary cleanup error:", cleanupError.message);
        }
      }

      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

// GET /api/product-images/:product_id
export const getProductImagesController = async (req, res) => {
  try {
    const { product_id } = req.validated?.params ?? req.params;
    const images = await getProductImagesByProductId(Number(product_id));
    return ok(res, "Product images fetched successfully", images);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

// GET /api/product-images/variant/:product_id
export const getVariantImageController = async (req, res) => {
  try {
    const { product_id } = req.validated?.params ?? req.params;
    const { product_portion_id, modifier_portion_id } = req.validated?.query ?? req.query;

    const image = await getVariantImageWithPriority(
      Number(product_id),
      product_portion_id ? Number(product_portion_id) : null,
      modifier_portion_id ? Number(modifier_portion_id) : null,
    );

    if (!image) {
      // Return 200 instead of 404 so frontend fallback UI can handle
      // "no image" without noisy network errors in browser console.
      return ok(res, "No image found", null);
    }

    return ok(res, "Variant image fetched successfully", image);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

// PATCH /api/product-images/:image_id/primary
export const setPrimaryProductImageController = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { image_id } = req.validated?.params ?? req.params;

    const image = await getImageById(Number(image_id));
    if (!image) {
      return notFound(res, "Image not found");
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await clearPrimaryByProductId(image.product_id, userId, conn);
      await setPrimaryByImageId(Number(image_id), userId, conn);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    const updated = await getImageById(Number(image_id));
    return ok(res, "Primary image updated successfully", updated);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

// PATCH /api/product-images/:image_id
export const updateProductImageController = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { image_id } = req.validated?.params ?? req.params;
    const updates = req.validated?.body ?? req.body ?? {};
    const hasBodyUpdates = Object.keys(updates).length > 0;

    if (!req.file && !hasBodyUpdates) {
      return badRequest(res, "Provide at least one field or image file to update");
    }

    const existingImage = await getImageById(Number(image_id));
    if (!existingImage) {
      return notFound(res, "Image not found");
    }

    const resolvedImageLevel = updates.image_level ?? existingImage.image_level;
    const resolvedProductPortionId =
      Object.prototype.hasOwnProperty.call(updates, "product_portion_id")
        ? updates.product_portion_id
        : existingImage.product_portion_id;
    const resolvedModifierPortionId =
      Object.prototype.hasOwnProperty.call(updates, "modifier_portion_id")
        ? updates.modifier_portion_id
        : existingImage.modifier_portion_id;
    const resolvedIsPrimary =
      updates.is_primary === undefined ? existingImage.is_primary : updates.is_primary;
    const productId = Number(existingImage.product_id);

    if (resolvedProductPortionId != null) {
      const portion = await findProductPortion(resolvedProductPortionId, productId);
      if (!portion) {
        return badRequest(res, "product_portion_id is not linked with product_id");
      }
    }

    if (resolvedModifierPortionId != null) {
      const modifierPortion = await findModifierPortion(resolvedModifierPortionId);
      if (!modifierPortion) {
        return badRequest(res, "modifier_portion_id does not exist");
      }

      if (Number(modifierPortion.product_id) !== productId) {
        return badRequest(res, "modifier_portion_id is not linked with product_id");
      }

      if (
        resolvedImageLevel === "VARIANT" &&
        Number(modifierPortion.product_portion_id) !== Number(resolvedProductPortionId)
      ) {
        return badRequest(res, "modifier_portion_id is not linked with product_portion_id");
      }
    }

    const folder = `products/product_${productId}/${resolvedImageLevel.toLowerCase()}`;
    let uploadedImage = null;

    if (req.file) {
      uploadedImage = await uploadBufferToCloudinary(req.file.buffer, folder);
    }

    const nextImageUrl = uploadedImage?.secure_url ?? updates.image_url ?? existingImage.image_url;
    const nextPublicId = uploadedImage?.public_id ?? updates.public_id ?? existingImage.public_id;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (Number(resolvedIsPrimary) === 1) {
        await clearPrimaryByProductId(productId, userId, conn);
      }

      await updateProductImageById(
        Number(image_id),
        {
          product_portion_id: resolvedProductPortionId,
          modifier_portion_id: resolvedModifierPortionId,
          image_level: resolvedImageLevel,
          image_url: nextImageUrl,
          public_id: nextPublicId,
          is_primary: Number(resolvedIsPrimary) === 1 ? 1 : 0,
          updated_by: userId,
        },
        conn,
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();

      if (uploadedImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(uploadedImage.public_id, { resource_type: "image" });
        } catch (cleanupError) {
          console.error("Cloudinary cleanup error:", cleanupError.message);
        }
      }

      throw error;
    } finally {
      conn.release();
    }

    if (uploadedImage?.public_id && existingImage.public_id) {
      try {
        await cloudinary.uploader.destroy(existingImage.public_id, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("Old Cloudinary image cleanup error:", cleanupError.message);
      }
    }

    const updated = await getImageById(Number(image_id));
    return ok(res, "Image updated successfully", updated);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

// DELETE /api/product-images/:image_id
export const deleteProductImageController = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { image_id } = req.validated?.params ?? req.params;

    const image = await getImageById(Number(image_id));
    if (!image) {
      return notFound(res, "Image not found");
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(image.public_id, {
      resource_type: "image",
      invalidate: true,
    });

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      return serverError(res, "Failed to delete image from Cloudinary");
    }

    await softDeleteImageById(Number(image_id), userId);

    return ok(res, "Image deleted successfully", {
      image_id: Number(image_id),
      public_id: image.public_id,
    });
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};



/**
 * @component ProductImagesPanel
 * @description Tab panel for managing product and modifier images.
 *
 * Two sections:
 *  1. Product primary image — upload, replace, or delete the main PRODUCT-level image
 *  2. Modifier images      — one image per modifier-portion link (MODIFIER-level)
 *
 * Images are uploaded to Cloudinary via adminProductImagesApi (multipart/form-data).
 * Thumbnails use Cloudinary URL transforms for optimized loading.
 *
 * Data sources:
 *  - adminProductImagesApi  → image CRUD
 *  - adminPortionsApi       → fetch product-portions to discover modifiers
 *  - adminModifiersApi      → fetch modifiers by portion or by product
 *
 * Props: product, onMutate, onFilePickerStateChange
 * Consumed by: ProductFormModal (Images tab)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Upload, Trash2, RefreshCw, ImageOff } from "lucide-react";
import SmartImage from "../../components/common/SmartImage";
import { useToast } from "../../context/ToastContext";
import {
  fetchProductImages,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
} from "../../../api/adminProductImagesApi";
import { fetchProductPortions } from "../../../api/adminPortionsApi";
import {
  fetchModifiersByProductPortion,
  fetchModifiersByProduct,
} from "../../../api/adminModifiersApi";
import { getOptimizedImageProps } from "../../utils/image";
import getApiErrorMessage from "../../utils/apiError";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImageFile(file, showToast) {
  if (!file) return false;
  if (!file.type.startsWith("image/")) {
    showToast("warn", "Invalid File", "Only image files are allowed");
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast("warn", "File Too Large", "Image must be under 5 MB");
    return false;
  }
  return true;
}

function ProductImagesPanel({
  product,
  onMutate,
  onFilePickerStateChange,
}) {
  const showToast = useToast();
  const productId = product?.product_id;
  const productUploadInputRef = useRef(null);
  const productReplaceInputRef = useRef(null);
  const modifierUploadInputRefs = useRef({});
  const modifierReplaceInputRefs = useRef({});

  // Data
  const [allImages, setAllImages] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModifiers, setLoadingModifiers] = useState(true);
  const [previewProductImage, setPreviewProductImage] = useState(null);
  const [previewModifierImages, setPreviewModifierImages] = useState({});

  // Upload / delete spinners
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingModifiers, setUploadingModifiers] = useState({});
  const [deletingImages, setDeletingImages] = useState({});

  const clearProductPreview = useCallback(() => {
    setPreviewProductImage((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const setProductPreview = useCallback((file) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewProductImage((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  }, []);

  const clearModifierPreview = useCallback((modifierPortionId) => {
    setPreviewModifierImages((prev) => {
      const current = prev[modifierPortionId];
      if (current) {
        URL.revokeObjectURL(current);
      }
      const next = { ...prev };
      delete next[modifierPortionId];
      return next;
    });
  }, []);

  const setModifierPreview = useCallback((modifierPortionId, file) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewModifierImages((prev) => {
      if (prev[modifierPortionId]) {
        URL.revokeObjectURL(prev[modifierPortionId]);
      }
      return {
        ...prev,
        [modifierPortionId]: objectUrl,
      };
    });
  }, []);

  // ── Fetch images ──
  const refreshImages = useCallback(async () => {
    if (!productId) return;
    try {
      const imgs = await fetchProductImages(productId);
      setAllImages(imgs);
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    }
  }, [productId, showToast]);

  // ── Load everything on mount ──
  useEffect(() => {
    if (!productId) return;

    const load = async () => {
      setLoading(true);
      setLoadingModifiers(true);
      try {
        const [imgs, portions] = await Promise.all([
          fetchProductImages(productId),
          fetchProductPortions(productId),
        ]);
        setAllImages(imgs);
        let allMods = [];
        if (portions.length === 0) {
          allMods = await fetchModifiersByProduct(productId);
        } else {
          const arrays = await Promise.all(
            portions.map((pp) =>
              fetchModifiersByProductPortion(pp.product_portion_id),
            ),
          );
          allMods = arrays.flat();
        }
        setModifiers(allMods);
      } catch (err) {
        showToast("error", "Error", getApiErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingModifiers(false);
      }
    };
    load();
  }, [productId, showToast]);

  useEffect(() => {
    return () => {
      if (previewProductImage) {
        URL.revokeObjectURL(previewProductImage);
      }
      Object.values(previewModifierImages).forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
    };
  }, [previewModifierImages, previewProductImage]);

  // ── Derived data ──
  const productImage = useMemo(
    () =>
      allImages.find(
        (img) => img.image_level === "PRODUCT" && img.is_primary,
      ) ||
      allImages.find((img) => img.image_level === "PRODUCT") ||
      null,
    [allImages],
  );

  const modifierImageMap = useMemo(() => {
    const map = {};
    allImages
      .filter((img) => img.image_level === "MODIFIER")
      .forEach((img) => {
        map[img.modifier_portion_id] = img;
      });
    return map;
  }, [allImages]);

  const displayedProductImageSrc =
    previewProductImage || productImage?.image_url || null;

  // ── Handlers ──
  const handleUploadProductImage = async (file) => {
    if (!validateImageFile(file, showToast)) return;
    setProductPreview(file);
    setUploadingProduct(true);
    try {
      await uploadProductImage({
        file,
        product_id: productId,
        image_level: "PRODUCT",
        is_primary: 1,
      });
      onMutate?.();
      showToast("success", "Success", "Product image uploaded");
      await refreshImages();
      clearProductPreview();
    } catch (err) {
      clearProductPreview();
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleReplaceProductImage = async (file) => {
    if (!validateImageFile(file, showToast) || !productImage) return;
    setProductPreview(file);
    setUploadingProduct(true);
    try {
      await updateProductImage(productImage.image_id, file);
      onMutate?.();
      showToast("success", "Success", "Product image replaced");
      await refreshImages();
      clearProductPreview();
    } catch (err) {
      clearProductPreview();
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleUploadModifierImage = async (modifierPortionId, file) => {
    if (!validateImageFile(file, showToast)) return;
    setModifierPreview(modifierPortionId, file);
    setUploadingModifiers((prev) => ({ ...prev, [modifierPortionId]: true }));
    try {
      await uploadProductImage({
        file,
        product_id: productId,
        image_level: "MODIFIER",
        modifier_portion_id: modifierPortionId,
        is_primary: 0,
      });
      onMutate?.();
      showToast("success", "Success", "Modifier image uploaded");
      await refreshImages();
      clearModifierPreview(modifierPortionId);
    } catch (err) {
      clearModifierPreview(modifierPortionId);
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setUploadingModifiers((prev) => ({
        ...prev,
        [modifierPortionId]: false,
      }));
    }
  };

  const handleReplaceModifierImage = async (
    modifierPortionId,
    imageId,
    file,
  ) => {
    if (!validateImageFile(file, showToast)) return;
    setModifierPreview(modifierPortionId, file);
    setUploadingModifiers((prev) => ({ ...prev, [modifierPortionId]: true }));
    try {
      await updateProductImage(imageId, file);
      onMutate?.();
      showToast("success", "Success", "Modifier image replaced");
      await refreshImages();
      clearModifierPreview(modifierPortionId);
    } catch (err) {
      clearModifierPreview(modifierPortionId);
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setUploadingModifiers((prev) => ({
        ...prev,
        [modifierPortionId]: false,
      }));
    }
  };

  const handleDeleteImage = async (imageId) => {
    setDeletingImages((prev) => ({ ...prev, [imageId]: true }));
    try {
      await deleteProductImage(imageId);
      onMutate?.();
      showToast("success", "Success", "Image deleted");
      await refreshImages();
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setDeletingImages((prev) => ({ ...prev, [imageId]: false }));
    }
  };

  // ── File input handler helper (resets input so same file can be re-selected) ──
  const stopInteraction = (e) => {
    e.stopPropagation();
  };

  const onFileSelect = (handler) => (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) handler(file);
    e.target.value = "";
    onFilePickerStateChange?.(false);
  };

  const openFilePicker = (inputRef, e) => {
    e.stopPropagation();
    onFilePickerStateChange?.(true);
    inputRef?.current?.click();
  };

  const openMappedFilePicker = (refs, key, e) => {
    e.stopPropagation();
    onFilePickerStateChange?.(true);
    refs.current[key]?.click();
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12">
        <ProgressSpinner
          style={{ width: "24px", height: "24px" }}
          strokeWidth="4"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading images...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-2">
      {/* ════════ Section 1: Product Primary Image ════════ */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Product Image
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          The main image shown in product listings and detail pages.
        </p>

        <div className="flex items-center gap-4">
          {displayedProductImageSrc ? (
            <div className="admin-image-preview w-40 h-40">
              <SmartImage
                {...getOptimizedImageProps(displayedProductImageSrc, {
                  width: 320,
                  height: 320,
                  srcSetWidths: [160, 320, 480, 640],
                  sizes: "160px",
                })}
                alt="Product"
                wrapperClassName="h-full w-full"
                className="w-full h-full object-cover"
              />
              <div className="admin-image-overlay">
                {uploadingProduct && !productImage ? (
                  <ProgressSpinner
                    style={{ width: "20px", height: "20px" }}
                    strokeWidth="4"
                  />
                ) : deletingImages[productImage?.image_id] ? (
                  <ProgressSpinner
                    style={{ width: "20px", height: "20px" }}
                    strokeWidth="4"
                  />
                ) : (
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="admin-image-overlay-btn !flex-1 !justify-center !rounded-lg !bg-black/65 !px-3 !py-2"
                      onClick={(e) => openFilePicker(productReplaceInputRef, e)}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs font-semibold">Replace</span>
                    </button>
                    <input
                      ref={productReplaceInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(e) => e.stopPropagation()}
                      onChange={onFileSelect(handleReplaceProductImage)}
                      disabled={!productImage}
                    />
                    <button
                      type="button"
                      className="admin-image-overlay-btn danger"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        borderRadius: "0.5rem",
                        background: "rgba(127, 29, 29, 0.82)",
                        padding: "0.5rem 0.75rem",
                      }}
                      onClick={() =>
                        productImage && handleDeleteImage(productImage.image_id)
                      }
                      disabled={!productImage}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs font-semibold">Delete</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="admin-image-primary-badge">PRIMARY</div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="admin-image-dropzone flex flex-col items-center justify-center w-40 h-40"
                onClick={(e) => openFilePicker(productUploadInputRef, e)}
              >
                {uploadingProduct ? (
                  <ProgressSpinner
                    style={{ width: "24px", height: "24px" }}
                    strokeWidth="4"
                  />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-2" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Upload Image
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Max 5 MB
                    </span>
                  </>
                )}
              </button>
              <input
                ref={productUploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingProduct}
                onClick={(e) => e.stopPropagation()}
                onChange={onFileSelect(handleUploadProductImage)}
              />
            </>
          )}

          {uploadingProduct && displayedProductImageSrc && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <ProgressSpinner
                style={{ width: "18px", height: "18px" }}
                strokeWidth="4"
              />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════ Section 2: Modifier Images ════════ */}
      {!loadingModifiers && modifiers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Modifier Images
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Upload an image for each modifier. Shown when a customer selects
            that option.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modifiers.map((mod) => {
              const modImage = modifierImageMap[mod.modifier_portion_id];
              const previewModifierImage =
                previewModifierImages[mod.modifier_portion_id] || null;
              const displayedModifierImageSrc =
                previewModifierImage || modImage?.image_url || null;
              const isUploading = uploadingModifiers[mod.modifier_portion_id];
              const isDeleting = modImage && deletingImages[modImage.image_id];

              return (
                <div
                  key={mod.modifier_portion_id}
                  className="admin-modifier-image-card"
                >
                  {/* Thumbnail slot */}
                  {displayedModifierImageSrc ? (
                    <div
                      className="admin-image-preview w-14 h-14 flex-shrink-0"
                      style={{ borderRadius: "0.5rem" }}
                    >
                      <SmartImage
                        {...getOptimizedImageProps(displayedModifierImageSrc, {
                          width: 112,
                          height: 112,
                          srcSetWidths: [112, 224],
                          sizes: "56px",
                        })}
                        alt={mod.modifier_value}
                        wrapperClassName="h-full w-full"
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="admin-image-overlay"
                        style={{ borderRadius: "0.5rem" }}
                      >
                        {isUploading && !modImage ? (
                          <ProgressSpinner
                            style={{ width: "14px", height: "14px" }}
                            strokeWidth="5"
                          />
                        ) : isDeleting ? (
                          <ProgressSpinner
                            style={{ width: "14px", height: "14px" }}
                            strokeWidth="5"
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-image-overlay-btn"
                              style={{ padding: "0.25rem" }}
                              onClick={(e) =>
                                openMappedFilePicker(
                                  modifierReplaceInputRefs,
                                  mod.modifier_portion_id,
                                  e,
                                )
                              }
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                            <input
                              ref={(node) => {
                                if (node) {
                                  modifierReplaceInputRefs.current[
                                    mod.modifier_portion_id
                                  ] = node;
                                } else {
                                  delete modifierReplaceInputRefs.current[
                                    mod.modifier_portion_id
                                  ];
                                }
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={!modImage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={onFileSelect((file) =>
                                handleReplaceModifierImage(
                                  mod.modifier_portion_id,
                                  modImage.image_id,
                                  file,
                                ),
                              )}
                            />
                            <button
                              type="button"
                              className="admin-image-overlay-btn danger"
                              style={{ padding: "0.25rem" }}
                              onClick={() =>
                                modImage && handleDeleteImage(modImage.image_id)
                              }
                              disabled={!modImage}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-image-dropzone w-14 h-14 flex-shrink-0 flex items-center justify-center"
                        style={{ borderRadius: "0.5rem" }}
                        onClick={(e) =>
                          openMappedFilePicker(
                            modifierUploadInputRefs,
                            mod.modifier_portion_id,
                            e,
                          )
                        }
                      >
                        {isUploading ? (
                          <ProgressSpinner
                            style={{ width: "16px", height: "16px" }}
                            strokeWidth="5"
                          />
                        ) : (
                          <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      <input
                        ref={(node) => {
                          if (node) {
                            modifierUploadInputRefs.current[
                              mod.modifier_portion_id
                            ] = node;
                          } else {
                            delete modifierUploadInputRefs.current[
                              mod.modifier_portion_id
                            ];
                          }
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onClick={(e) => e.stopPropagation()}
                        onChange={onFileSelect((file) =>
                          handleUploadModifierImage(
                            mod.modifier_portion_id,
                            file,
                          ),
                        )}
                      />
                    </>
                  )}

                  {/* Modifier label */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {mod.modifier_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {mod.modifier_value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── No modifiers message ── */}
      {!loadingModifiers && modifiers.length === 0 && (
        <div className="flex flex-col items-center py-6 text-center">
          <ImageOff className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No modifiers assigned yet. Add modifiers on the{" "}
            <strong>Modifiers</strong> tab to upload individual modifier images.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductImagesPanel;
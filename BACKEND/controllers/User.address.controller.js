import pool from "../configs/db.js";
import {
  addUserAddressModel,
  deleteAddressModel,
  getAddressByIdModel,
  getAllAddresses,
  getDefaultAddressModel,
  removeDefaultAddress,
  setDefaultAddressModel,
  updateAddressModel,
} from "../models/user.address.model.js";
import {
  created,
  badRequest,
  serverError,
  ok,
  notFound,
} from "../utils/apiResponse.js";

export const addUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = {
      user_id: userId,
      full_name: req.body.full_name,
      phone: req.body.phone,
      address_line1: req.body.address_line1,
      address_line2: req.body.address_line2 || null,
      city: req.body.city,
      state: req.body.state,
      postal_code: req.body.postal_code,
      country: req.body.country || "India",
      created_at: new Date(),
      created_by: userId,
    };

    const result = await addUserAddressModel(data);

    return created(res, "Address added successfully", {
      address_id: result.insertId,
    });
  } catch (error) {
    console.error("Add address error:", error);
    return serverError(res, "Failed to add address");
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    // 1️ Remove existing default address
    await removeDefaultAddress(userId);

    // 2️ Set selected address as default
    const result = await setDefaultAddressModel(userId, addressId);

    if (result.affectedRows === 0) {
      return notFound(res, "Address not found");
    }

    return ok(res, "Address set as default successfully");
  } catch (error) {
    console.error("Set default address error:", error);
    return serverError(res, "Failed to set default address");
  }
};

export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getDefaultAddressModel(userId);

    if (result.length === 0) {
      return notFound(res, "No default address found");
    }

    return ok(res, "Default address fetched successfully", result[0]);
  } catch (error) {
    console.error("Get Default Address Error:", error);
    return serverError(res);
  }
};

export const showAllUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getAllAddresses(userId);

    return ok(
      res,
      result.length === 0
        ? "No addresses found"
        : "Addresses fetched successfully",
      result,
    );
  } catch (error) {
    console.error("Fetch addresses error:", error);
    return serverError(res, "Failed to fetch addresses");
  }
};

export const getAddressById = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    if (!addressId) {
      return badRequest(res, "Address ID is required");
    }

    const result = await getAddressByIdModel(addressId, userId);

    if (!result || result.length === 0) {
      return notFound(res, "Address not found");
    }

    return ok(res, "Address fetched successfully", result[0]);
  } catch (error) {
    console.error("Get Address Error:", error);
    return serverError(res);
  }
};

export const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.user.id;

    const data = {
      ...req.body,
      updated_at: new Date(),
      updated_by: userId,
    };

    const result = await updateAddressModel(data, userId, addressId);

    if (result.affectedRows === 0) {
      return notFound(res, "Address not found or already deleted");
    }

    return ok(res, "Address updated successfully");
  } catch (error) {
    console.error("Update address error:", error);
    return serverError(res, "Failed to update address");
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.user.id;

    // Soft delete only if address belongs to user and not already deleted
    const result = await deleteAddressModel(addressId, userId);

    if (result.affectedRows === 0) {
      return notFound(res, "Address not found or already deleted");
    }

    return ok(res, "Address deleted successfully");
  } catch (error) {
    console.error("Delete address error:", error);
    return serverError(res, "Failed to delete address");
  }
};

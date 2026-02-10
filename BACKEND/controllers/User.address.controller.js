import {
  addUserAddressModel,
  deleteAddressModel,
  getAllAddresses,
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

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    } = req.body;

    // Required field validation
    if (
      !full_name ||
      !phone ||
      !address_line1 ||
      !city ||
      !state ||
      !postal_code
    ) {
      return badRequest(res, "All required address fields must be provided");
    }

    //  Store everything inside data object
    const data = {
      user_id: userId,
      full_name,
      phone,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state,
      postal_code,
      country,
      created_at: new Date(),
      created_by: userId,
    };

    //data go into model for insert
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

export const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    } = req.body;

    // 1️ At least one field must be provided
    if (
      !full_name &&
      !phone &&
      !address_line1 &&
      !address_line2 &&
      !city &&
      !state &&
      !postal_code &&
      !country
    ) {
      return badRequest(res, "At least one field is required to update");
    }

    // 2️ Build dynamic update object
    const data = {};

    if (full_name) data.full_name = full_name;
    if (phone) data.phone = phone;
    if (address_line1) data.address_line1 = address_line1;
    if (address_line2) data.address_line2 = address_line2;
    if (city) data.city = city;
    if (state) data.state = state;
    if (postal_code) data.postal_code = postal_code;
    if (country) data.country = country;

    data.updated_at = new Date();

    // 3️ Update only if not deleted and belongs to user
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
    const addressId = req.params.id;
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


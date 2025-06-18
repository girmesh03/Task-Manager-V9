import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import CustomError from "../errorHandler/CustomError.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Deletes resources from Cloudinary with bulk operation support
 */
export const deleteFromCloudinary = async (
  publicIds,
  resourceType = "auto"
) => {
  if (!publicIds || (Array.isArray(publicIds) && publicIds.length === 0)) {
    return;
  }

  try {
    const idsToDelete = Array.isArray(publicIds) ? publicIds : [publicIds];
    const BULK_LIMIT = 100;

    if (idsToDelete.length <= BULK_LIMIT) {
      await cloudinary.api.delete_resources(idsToDelete, {
        resource_type: resourceType,
        type: "upload",
      });
    } else {
      for (let i = 0; i < idsToDelete.length; i += BULK_LIMIT) {
        const chunk = idsToDelete.slice(i, i + BULK_LIMIT);
        await cloudinary.api.delete_resources(chunk, {
          resource_type: resourceType,
          type: "upload",
        });
      }
    }

    console.log(`Deleted ${idsToDelete.length} Cloudinary resources`);
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw new CustomError("Media cleanup failed", 500, "MEDIA-500", {
      publicIds,
      resourceType,
    });
  }
};

export default cloudinary;

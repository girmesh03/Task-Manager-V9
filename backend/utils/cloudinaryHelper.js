import { v2 as cloudinary } from "cloudinary";
import CustomError from "../errorHandler/CustomError.js";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Deletes one or more resources from Cloudinary
 * @param {string|string[]} publicIds - Single ID or array of IDs
 * @param {'image'|'video'|'raw'|'auto'} [resourceType='auto']
 * @returns {Promise<void>}
 * @throws {CustomError} On deletion failure
 */
export const deleteFromCloudinary = async (
  publicIds,
  resourceType = "auto"
) => {
  console.log("deleting from cloudinary: ", publicIds, resourceType);

  // Handle empty input
  if (!publicIds || (Array.isArray(publicIds) && publicIds.length === 0)) {
    return;
  }

  // Normalize to array
  const idsToDelete = Array.isArray(publicIds) ? publicIds : [publicIds];
  const BULK_LIMIT = 100;

  try {
    if (idsToDelete.length <= BULK_LIMIT) {
      await cloudinary.api.delete_resources(idsToDelete, {
        resource_type: resourceType,
        type: "upload",
      });
    } else {
      // Process in chunks
      for (let i = 0; i < idsToDelete.length; i += BULK_LIMIT) {
        const chunk = idsToDelete.slice(i, i + BULK_LIMIT);
        await cloudinary.api.delete_resources(chunk, {
          resource_type: resourceType,
          type: "upload",
        });
      }
    }
  } catch (error) {
    console.error(`Cloudinary Deletion Error:`, error);
    throw new CustomError(
      "Media cleanup failed on Cloudinary",
      500,
      "MEDIA_CLOUD_DELETE_FAILED",
      {
        publicIds: idsToDelete,
        resourceType,
        originalError: error.message,
      }
    );
  }
};

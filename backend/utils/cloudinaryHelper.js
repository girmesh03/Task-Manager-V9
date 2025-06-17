import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
// import CustomError from "../errorHandler/CustomError.js";

// Configure Cloudinary - ensure these are in your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Deletes resources from Cloudinary.
 * @param {string | string[]} publicIds - A single public_id or an array of public_ids.
 * @param {string} resourceType - The type of resource ('image', 'video', 'raw'). Defaults to 'auto'.
 */
export const deleteFromCloudinary = async (
  publicIds,
  resourceType = "auto"
) => {
  if (!publicIds || (Array.isArray(publicIds) && publicIds.length === 0)) {
    return; // Nothing to delete
  }

  try {
    const idsToDelete = Array.isArray(publicIds) ? publicIds : [publicIds];

    // Group IDs by their resource type for efficient deletion
    // For now, we assume a mix and use 'auto' or delete individually.
    // A more advanced version could group by type.

    // For mixed resource types, it's safer to delete one by one if types are not known.
    // However, if we know the type, we can use delete_resources.
    // As our uploader uses 'auto', we'll rely on individual deletes for safety.

    const deletionPromises = idsToDelete.map((id) =>
      cloudinary.uploader.destroy(id, { resource_type: resourceType })
    );

    await Promise.all(deletionPromises);
    console.log(
      `Successfully deleted ${idsToDelete.length} resource(s) from Cloudinary.`
    );
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    // We log the error but don't throw, to not block the primary delete operation.
    // In a production system, you might queue this for a retry.
  }
};

export default cloudinary;

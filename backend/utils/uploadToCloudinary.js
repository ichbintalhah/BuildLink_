const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} fileName - File name for the upload
 * @param {{ returnMetadata?: boolean }} [options] - Return URL + public_id
 * @returns {Promise<string|{url: string, public_id: string}>}
 */
const uploadToCloudinary = async (fileBuffer, folder, fileName, options = {}) => {
  if (!fileBuffer) {
    throw new Error("File buffer is required");
  }

  const { returnMetadata = false } = options;

  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          public_id: fileName,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            if (returnMetadata) {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
              return;
            }
            resolve(result.secure_url);
          }
        },
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Upload error: ${error.message}`);
  }
};

module.exports = uploadToCloudinary;

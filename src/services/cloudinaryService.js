const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is present, the library auto-configures itself.
  // We don't need to manually call config().
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} folder - The folder in Cloudinary.
 * @param {string} publicId - The public ID for the file.
 * @returns {Promise<string>} - Resolves with the secure URL.
 */
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'raw', // Force 'raw' for PDFs to ensure they download correctly
        format: 'pdf',        // Explicitly set format
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = { uploadToCloudinary };

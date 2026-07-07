import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary, isCloudinaryConfigured };

/** Upload an in-memory buffer to Cloudinary. Returns { url, public_id }. */
export function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured || !publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

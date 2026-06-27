import imageCompression from 'browser-image-compression';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/durcctmhu/auto/upload';
const UPLOAD_PRESET = 'pingly_uploads';
const ASSET_FOLDER = 'pingly/media';

export type UploadProgressCallback = (progress: number) => void;

/**
 * Uploads a file to Cloudinary via XMLHttpRequest to support progress tracking.
 */
async function uploadToCloudinary(
  file: Blob | File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_URL, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(`Cloudinary upload failed: ${response.error?.message || xhr.statusText}`));
        } catch {
          reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', ASSET_FOLDER);

    xhr.send(formData);
  });
}

export async function uploadImage(
  file: File | Blob,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const options = {
    maxSizeMB: 0.3, // 300KB target
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    // browser-image-compression can handle File and Blob
    const compressedFile = await imageCompression(file as File, options);
    return await uploadToCloudinary(compressedFile, onProgress);
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to original file if compression fails
    return await uploadToCloudinary(file, onProgress);
  }
}

export async function uploadVoice(
  blob: Blob,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return uploadToCloudinary(blob, onProgress);
}

export async function uploadAvatar(
  file: File | Blob,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const options = {
    maxSizeMB: 0.2, // 200KB max for avatars
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file as File, options);
    return await uploadToCloudinary(compressedFile, onProgress);
  } catch (error) {
    console.error('Avatar compression failed:', error);
    return await uploadToCloudinary(file, onProgress);
  }
}

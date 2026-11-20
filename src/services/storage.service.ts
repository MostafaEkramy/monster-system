// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Free Base64 Text Storage Service
// ============================================================

export interface UploadResult {
  url: string; // Base64 Data URL (data:image/jpeg;base64,...)
  storagePath: string;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}

/**
 * Compress an image file to Base64 Text (100% free, stored in Firestore directly)
 * Uses HTML5 Canvas client-side compression to keep size under ~50-80 KB.
 */
export function compressImageToBase64(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, just read as standard Data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a user's profile image as Base64 text.
 * Stores directly as a string, completely free without Firebase Storage buckets.
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<UploadResult> {
  onProgress?.(30);
  const base64Text = await compressImageToBase64(file, 400, 400, 0.8);
  onProgress?.(100);

  return {
    url: base64Text,
    storagePath: `base64/profile-images/${userId}`,
  };
}

/**
 * Upload a task attachment or submission file as text / Base64.
 */
export async function uploadSubmissionFile(
  taskId: string,
  userId: string,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<UploadResult> {
  onProgress?.(30);
  // Compress if image, otherwise read as Base64 Data URL
  const base64Text = await compressImageToBase64(file, 1024, 1024, 0.7);
  onProgress?.(100);

  return {
    url: base64Text,
    storagePath: `base64/submissions/${taskId}/${userId}_${file.name}`,
  };
}

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<UploadResult> {
  onProgress?.(30);
  const base64Text = await compressImageToBase64(file, 1024, 1024, 0.7);
  onProgress?.(100);

  return {
    url: base64Text,
    storagePath: `base64/task-attachments/${taskId}_${file.name}`,
  };
}

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): FileValidation {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

export async function deleteFile(path: string): Promise<void> {
  // Base64 files are stored directly in Firestore docs, no external deletion needed
  return Promise.resolve();
}

import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = "btconline/logos";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function uploadLogoBuffer(
  buffer: Buffer,
  publicId: string,
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        unique_filename: false,
        use_filename: false,
        resource_type: "image",
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error("Cloudinary upload returned no result"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function listLogos(): Promise<{ name: string; path: string }[]> {
  const res = await cloudinary.api.resources({
    type: "upload",
    prefix: `${CLOUDINARY_FOLDER}/`,
    max_results: 500,
  });
  return (res.resources || []).map((r: any) => ({
    name: String(r.public_id).split("/").pop() || r.public_id,
    path: r.secure_url,
  }));
}

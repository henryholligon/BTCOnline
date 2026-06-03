import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = "BTC Online Merchant Logos";

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
  filenameBase: string,
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        asset_folder: CLOUDINARY_FOLDER,
        use_filename: true,
        filename_override: filenameBase,
        unique_filename: true,
        overwrite: false,
        invalidate: true,
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
  const res = await cloudinary.search
    .expression(`asset_folder="${CLOUDINARY_FOLDER}"`)
    .max_results(500)
    .execute();
  return (res.resources || []).map((r: any) => ({
    name: String(r.public_id).split("/").pop() || r.public_id,
    path: r.secure_url,
  }));
}

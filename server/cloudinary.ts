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

// Cloudinary filenames that don't normalize-match their merchant name (typos/variants)
const LOGO_NAME_OVERRIDES: Record<string, string> = {
  farfetch: "farftech",
  thehumanrightsfoundation: "humanrightsfoundation",
  mullvadvpn: "mullvad",
  dopegallery: "dopegallary",
  stjudeschildrensresearchhospital: "stjudes",
};

const logoKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Map of normalized merchant name -> Cloudinary secure URL, derived from the folder.
// Public IDs look like "Merchant_Name_<6char>"; strip the suffix, then normalize.
export async function getLogoUrlMap(): Promise<Map<string, string>> {
  const res = await cloudinary.search
    .expression(`asset_folder="${CLOUDINARY_FOLDER}"`)
    .max_results(500)
    .execute();
  const map = new Map<string, string>();
  for (const r of res.resources || []) {
    const key = logoKey(String(r.public_id).replace(/_[a-z0-9]{6}$/i, ""));
    if (key && !map.has(key)) map.set(key, r.secure_url);
  }
  for (const [merchantKey, assetKey] of Object.entries(LOGO_NAME_OVERRIDES)) {
    const url = map.get(assetKey);
    if (url && !map.has(merchantKey)) map.set(merchantKey, url);
  }
  return map;
}

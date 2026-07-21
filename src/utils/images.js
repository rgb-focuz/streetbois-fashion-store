export const optimizeSupabaseImage = (
  imageUrl,
  { width = 600, height, quality = 72, resize = "cover" } = {}
) => {
  if (!imageUrl || typeof imageUrl !== "string") return "";

  if (!imageUrl.includes("/storage/v1/object/public/")) {
    return imageUrl;
  }

  const optimizedUrl = imageUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const url = new URL(optimizedUrl);

  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality));
  url.searchParams.set("resize", resize);

  if (height) {
    url.searchParams.set("height", String(height));
  }

  return url.toString();
};

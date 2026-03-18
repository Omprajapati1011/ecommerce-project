export function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("/upload/");
}

export function transformCloudinaryUrl(
  url,
  {
    width,
    height,
    fit = "fill",
    quality = "auto",
    format = "auto",
  } = {}
) {
  if (!isCloudinaryUrl(url)) return url;

  const transforms = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${fit}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);

  if (transforms.length === 0) return url;

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

export function buildCloudinarySrcSet(
  url,
  {
    widths = [160, 320, 480, 640, 960, 1280],
    height,
    fit = "fill",
    quality = "auto",
    format = "auto",
  } = {}
) {
  if (!isCloudinaryUrl(url)) return undefined;

  return widths
    .map((width) => {
      const transformed = transformCloudinaryUrl(url, {
        width,
        height,
        fit,
        quality,
        format,
      });

      return `${transformed} ${width}w`;
    })
    .join(", ");
}

export function getOptimizedImageProps(
  url,
  {
    width,
    height,
    fit = "fill",
    quality = "auto",
    format = "auto",
    sizes,
    srcSetWidths,
  } = {}
) {
  return {
    src: transformCloudinaryUrl(url, {
      width,
      height,
      fit,
      quality,
      format,
    }),
    srcSet: buildCloudinarySrcSet(url, {
      widths: srcSetWidths,
      height,
      fit,
      quality,
      format,
    }),
    sizes,
  };
}

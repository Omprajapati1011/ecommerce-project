import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

function SmartImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  fallbackClassName = "",
  iconClassName = "h-5 w-5 text-gray-400",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  sizes,
  srcSet,
}) {
  const imageRef = useRef(null);
  const [status, setStatus] = useState(src ? "loading" : "error");

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  useEffect(() => {
    const image = imageRef.current;

    if (!src || !image) {
      return;
    }

    if (image.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`.trim()}>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gray-100 dark:bg-gray-800" />
      )}

      {status !== "error" && (
        <img
          ref={imageRef}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={loading}
          decoding={decoding}
          fetchpriority={fetchPriority}
          className={`${className} transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`.trim()}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {status === "error" && (
        <div
          className={`flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800 ${fallbackClassName}`.trim()}
        >
          <ImageOff className={iconClassName} />
        </div>
      )}
    </div>
  );
}

export default SmartImage;

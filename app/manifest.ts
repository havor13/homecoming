import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Homecoming",
    short_name: "Homecoming",
    description: "An independent community for returned missionaries.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eef3f0",
    theme_color: "#0e6b5b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life as a Room",
    short_name: "Life Room",
    description: "A room shaped by the life you live.",
    start_url: "/",
    display: "standalone",
    background_color: "#332b43",
    theme_color: "#4b3b5d",
    orientation: "any",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

import type { MetadataRoute } from "next";

/**
 * Manifest PWA: permite "Adicionar ao ecrã inicial" e abrir o Despact em
 * ecrã inteiro (standalone), sem a interface do browser.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Despact",
    short_name: "Despact",
    description: "Plataforma pessoal de finanças orientada a decisões.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F4",
    theme_color: "#1E2230",
    lang: "pt",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

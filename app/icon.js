import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Ícono de la pestaña del navegador en todas las páginas: el cerebrito 🧠 del logo de la navbar.
// El dibujo está en app/lib/brain-emoji.svg (para cambiarlo, reemplazá ese archivo)
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const svg = await readFile(join(process.cwd(), "app/lib/brain-emoji.svg"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <img src={`data:image/svg+xml;base64,${svg.toString("base64")}`} width={60} height={60} alt="" />
      </div>
    ),
    size
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Ícono cuando alguien guarda la página en la pantalla de inicio del celular:
// el mismo cerebrito de icon.js, sobre el rosa clarito del sitio (iOS no deja fondo transparente)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), "app/lib/brain-emoji.svg"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffe4ef"
        }}
      >
        <img src={`data:image/svg+xml;base64,${svg.toString("base64")}`} width={128} height={128} alt="" />
      </div>
    ),
    size
  );
}

import "./globals.css";

export const metadata = {
  title: "Stream Counter",
  description: "Contador de stream de Twitch"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

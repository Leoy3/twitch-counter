import "./globals.css";

export const metadata = {
  title: "Brains Counter Stream",
  description: "Countdown until the next eatfreshbrains stream"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

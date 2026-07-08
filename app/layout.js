import "./globals.css";

export const metadata = {
  title: "Brains Counter Stream",
  description: "Countdown until the next eatfreshbrains stream",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

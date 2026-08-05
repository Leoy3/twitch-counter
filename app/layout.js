import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Brains Counter Stream",
  description: "Countdown until the next eatfreshbrains stream"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <Link href="/">Home</Link>
          <Link href="/fanart">Fanarts</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}

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
          <Link className="site-nav-logo" href="/">
            Brains
          </Link>

          <div className="site-nav-links">
            <Link href="/">Home</Link>
            <Link href="/fanart">Fanarts</Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

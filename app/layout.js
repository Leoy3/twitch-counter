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
          <div className="site-nav-side site-nav-left">
            <Link href="/">Home</Link>
          </div>

          <Link className="site-nav-logo" href="/">
            EatFreshBrains
          </Link>

          <div className="site-nav-side site-nav-right">
            <Link href="/fanart">Fanarts</Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

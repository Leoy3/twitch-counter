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
          <Link className="site-nav-brand" href="/">
            <span className="site-nav-mark">☠</span>
            <span>eatfreshbrains</span>
          </Link>

          <div className="site-nav-links">
            <Link className="site-nav-link site-nav-link-active" href="/">
              Home
            </Link>
            <Link className="site-nav-link" href="/fanart">
              Fanarts
            </Link>
          </div>

          <div className="site-nav-socials">
            <a
              className="site-nav-icon"
              href="https://www.twitch.tv/eatfreshbrains"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitch"
            >
              T
            </a>

            <a
              className="site-nav-icon"
              href="https://www.tiktok.com/@imbrains"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
            >
              ♪
            </a>

            <a
              className="site-nav-icon"
              href="https://x.com/soybrains"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              X
            </a>

            <a
              className="site-nav-icon"
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              ◎
            </a>

            <a
              className="site-nav-icon"
              href="https://discord.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Discord"
            >
              D
            </a>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

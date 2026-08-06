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
            <span className="site-nav-mark">🧠</span>
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
              title="Twitch"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h15v10.4l-3.8 3.8h-3.1l-2.3 2.3H8.5v-2.3H5V4Zm2.1 2.1v9.9h3.5v2.1l2.1-2.1h3.1l2.1-2.1V6.1H7.1Zm4.1 2.6h1.8v5.1h-1.8V8.7Zm4.8 0h1.8v5.1H16V8.7Z" />
              </svg>
            </a>

            <a
              className="site-nav-icon"
              href="https://x.com/soybrains"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              title="X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.2 10.4 21.3 2h-1.7l-6.2 7.3L8.5 2H2.8l7.5 11-7.5 9h1.7l6.6-7.8 5.3 7.8h5.7l-7.9-11.6Zm-2.3 2.7-.8-1.1-6-8.6h2.6l4.8 6.9.8 1.1 6.3 9.1H17l-5.1-7.4Z" />
              </svg>
            </a>

            <a
              className="site-nav-icon"
              href="https://www.tiktok.com/@imbrains"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 2c.3 2.5 1.7 4.1 4.1 4.4v3.2c-1.4.1-2.8-.3-4.1-1.1v6.2c0 4.5-4.9 7.3-8.8 5.1-3.8-2.1-3.8-7.6.1-9.7 1.1-.6 2.3-.8 3.6-.6v3.4c-.6-.2-1.2-.1-1.8.2-1.4.8-1.5 2.8-.1 3.7 1.4.9 3.3-.1 3.3-1.8V2h3.7Z" />
              </svg>
            </a>

            <a
              className="site-nav-icon"
              href="https://vgen.co/eatfreshbrains"
              target="_blank"
              rel="noreferrer"
              aria-label="VGen"
              title="VGen"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.2 4h4.1l4.6 11.1L16.6 4h4.2L14 20h-4L3.2 4Zm13.2 9.6h4.1v2.1h-4.1v-2.1Zm0 4.3h4.1V20h-4.1v-2.1Z" />
              </svg>
            </a>

            <a
              className="site-nav-icon"
              href="https://throne.com/brains"
              target="_blank"
              rel="noreferrer"
              aria-label="Throne"
              title="Throne"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.3 8.2 13 12 5l3.8 8L20 9.3V19H4V9.3Zm2.2 4.8V17h11.6v-2.9l-2.7 2.4-3.1-6.4-3.1 6.4-2.7-2.4Z" />
              </svg>
            </a>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

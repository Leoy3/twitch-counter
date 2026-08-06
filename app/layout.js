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
                <path
                  fill="currentColor"
                  d="M4.3 3h16.4v11.2l-4.7 4.7h-3.8L9.8 21H7.1v-2.1H3.3V6.8L4.3 3Zm2.1 2.1v11.7h4v2.1l2.1-2.1h3.8l2.3-2.3V5.1H6.4Zm3.8 3.2h2.1v5.7h-2.1V8.3Zm5.2 0h2.1v5.7h-2.1V8.3Z"
                />
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
                <path
                  fill="currentColor"
                  d="M14.2 10.4 21.3 2h-1.7l-6.2 7.3L8.5 2H2.8l7.5 11-7.5 9h1.7l6.6-7.8 5.3 7.8h5.7l-7.9-11.6Zm-2.3 2.7-.8-1.1-6-8.6h2.6l4.8 6.9.8 1.1 6.3 9.1H17l-5.1-7.4Z"
                />
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
                <path
                  fill="currentColor"
                  d="M15.5 2c.3 2.5 1.7 4.1 4.1 4.4v3.2c-1.4.1-2.8-.3-4.1-1.1v6.2c0 4.5-4.9 7.3-8.8 5.1-3.8-2.1-3.8-7.6.1-9.7 1.1-.6 2.3-.8 3.6-.6v3.4c-.6-.2-1.2-.1-1.8.2-1.4.8-1.5 2.8-.1 3.7 1.4.9 3.3-.1 3.3-1.8V2h3.7Z"
                />
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
                <path
                  fill="currentColor"
                  d="M2.8 4.2h4.3l4.9 12.1 4.9-12.1h4.3L14.3 20h-4.6L2.8 4.2Z"
                />
                <path
                  fill="currentColor"
                  d="M15.2 13.3h5.9v2.1h-3.5v1.2h3.1v2h-3.1V20h-2.4v-6.7Z"
                />
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
                <path
                  fill="currentColor"
                  d="M4 9.3 8.2 13 12 5l3.8 8L20 9.3V19H4V9.3Zm2.2 4.8V17h11.6v-2.9l-2.7 2.4-3.1-6.4-3.1 6.4-2.7-2.4Z"
                />
              </svg>
            </a>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

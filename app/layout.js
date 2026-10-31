import { Fredoka, Nunito } from "next/font/google";
import SiteNav from "./SiteNav";
import { THEME_INIT_SCRIPT } from "./theme";
import "./globals.css";
import "./theme-pastel.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display"
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-body"
});

export const metadata = {
  title: "Brains Counter Stream",
  description: "Countdown until the next eatfreshbrains stream",
  other: {
    google: "notranslate"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      translate="no"
      className={`notranslate ${fredoka.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body translate="no">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}

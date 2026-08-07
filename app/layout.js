import SiteNav from "./SiteNav";
import "./globals.css";

export const metadata = {
  title: "Brains Counter Stream",
  description: "Countdown until the next eatfreshbrains stream",
  other: {
    google: "notranslate"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body translate="no">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}

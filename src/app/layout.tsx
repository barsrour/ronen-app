import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Ronen App",
  description: "Quote system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/dashboard" className="brand">
              <div className="brand-logo">
                <Image
                  src="/logo.png"
                  alt="לוגו רונן סרור"
                  width={56}
                  height={56}
                  style={{ objectFit: "contain" }}
                />
              </div>

              <div className="brand-text">
                <div className="brand-title">רונן סרור</div>
                <div className="brand-subtitle">עבודות חשמל ותקשורת</div>
              </div>
            </Link>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
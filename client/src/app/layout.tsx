import type { Metadata } from "next";
import "./globals.css";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff2",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff2",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "Video Chat App",
  description: "Real-time video chat application with WebRTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

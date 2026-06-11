import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/lib/socket-context";
import { Toaster } from "@/components/ui/toaster";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  // title: "AI Là Gián Điệp? — Game suy luận cho hội bạn",
  title: "Big query",
  description:
    "Trò chơi suy luận multiplayer: tìm ra gián điệp ẩn mình trước khi quá muộn. Tạo phòng, mời bạn bằng link, chơi ngay trên điện thoại.",
  applicationName: "AI Là Gián Điệp?",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gián Điệp" },
  openGraph: {
    title: "AI Là Gián Điệp?",
    description: "Bạn có tìm ra gián điệp trước khi quá muộn?",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body>
        <SocketProvider>
          <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
            {children}
          </div>
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G-Coder — Interactive G-Code Reference",
  description:
    "Cross-firmware G-code and M-code reference for CNC controllers including grbl, grblHAL, LinuxCNC, Smoothieware, and RepRapFirmware.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}

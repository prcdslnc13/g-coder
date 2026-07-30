import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GCode Atlas — Cross-Firmware G-Code Reference",
  description:
    "Search and compare G-code, M-code, and $ settings across open-source CNC firmwares: grbl, grblHAL, LinuxCNC, Smoothieware, RepRapFirmware, and FluidNC.",
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

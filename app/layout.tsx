import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sea View Skydiving | Greedy Adventures",
  description:
    "A leap beyond the ordinary. Explore tandem skydiving over the Gulf of Thailand. Assignment prototype.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

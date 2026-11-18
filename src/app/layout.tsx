import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export const metadata: Metadata = {
  title: "مساحتنا الخاصة | اسألي محمد",
  description: "مساحة دافئة لأسئلتك عن محمد وحكاياتكما وأحلامكما معاً.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: "try { const savedTheme = localStorage.getItem('mohamed-asmaa-theme'); document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.theme = 'light'; }" }} />
    </head>
    <body>{children}</body>
  </html>;
}

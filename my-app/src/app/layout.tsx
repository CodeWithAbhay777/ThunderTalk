import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
	title: "Thunder Talk — Private Diary",
	description: "A private, browser-encrypted diary.",
	robots: { index: false, follow: false },
	icons: {
		icon: [{ url: "/ThunderTalk_logo.png", type: "image/png" }],
		shortcut: "/ThunderTalk_logo.png",
		apple: "/ThunderTalk_logo.png",
	},
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

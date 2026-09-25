import "./globals.css";

export const metadata = {
  title: "Intern Performance Dashboard",
  description: "Daily/weekly/monthly performance trends and tiering for Uvix interns.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

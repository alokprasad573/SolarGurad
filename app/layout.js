import './globals.css';

export const metadata = {
  title: 'SolarGuard | Green Intelligence',
  description: 'Protecting Every Photon with AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col items-center">{children}</body>
    </html>
  );
}

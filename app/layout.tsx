import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/pinyon-script/400.css';
import '@fontsource/allura/400.css';
import './globals.css';
import './redesign.css';
import { event, events, fullNames, siteUrl } from '../lib/event';

const base = siteUrl();
const names = fullNames;
const shareTitle = `${names} | Wedding Invitation`;
const shareText = `You are invited to the wedding reception of ${names}. ${event.displayDay}, ${event.displayDate} ${event.displayMonthYear}.`;
const GA = process.env.NEXT_PUBLIC_GA_ID;
export const metadata: Metadata = {
  ...(base ? { metadataBase: new URL(base) } : {}),
  title: shareTitle,
  description: shareText,
  applicationName: names,
  // a private invitation: keep it out of Google search results (link previews are not affected)
  robots: { index: false, follow: false },
  openGraph: {
    title: names,
    description: shareText,
    siteName: shareTitle,
    url: base || undefined,
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: `${names}, wedding invitation` }],
  },
  twitter: { card: 'summary_large_image', title: names, description: shareText, images: ['/og.jpg'] },
  icons: { icon: [{ url: '/favicon.png', type: 'image/png' }, { url: '/favicon.ico', sizes: 'any' }], apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#fcf6ef', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(events.map((e) => ({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: e.title,
              startDate: new Date(e.startMs).toISOString(),
              endDate: new Date(e.endMs).toISOString(),
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              eventStatus: 'https://schema.org/EventScheduled',
              location: { '@type': 'Place', name: e.line1.replace(/,$/, ''), address: e.addressOneLine },
              image: base ? [`${base}/og.jpg`] : undefined,
              description: shareText,
            }))),
          }}
        />
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');`}</Script>
          </>
        )}
      </body>
    </html>
  );
}
import '@mantine/core/styles.css';

import React from 'react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider, createTheme } from '@mantine/core';
import { Header } from '@/components/Header/Header';
import { Notifications } from '@mantine/notifications';

export const metadata = {
  title: 'Red-Black Tree Lesson',
  description: 'Red-Black Tree Examples XYZ',
};

const myTheme = createTheme({
  fontFamily: 'Georgia, sans-serif',
  primaryColor: 'red',
});

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="dark"/>
        <link rel="shortcut icon" href="/favicon.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={myTheme} forceColorScheme="dark">
          <Notifications />
          <Header />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

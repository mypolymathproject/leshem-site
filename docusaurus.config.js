// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Leshem Shvo v\'Achlama',
  tagline: 'An Annotated Translation of the Leshem\'s Introduction to Kabbalah',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://leshem.karunakaran.com',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Leshem Shvo v\'Achlama',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'leshemSidebar',
            position: 'left',
            label: 'Text',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Leshem Shvo v'Achlama — Annotated Translation`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;

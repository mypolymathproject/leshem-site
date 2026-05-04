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

  url: 'https://leshem-site.vercel.app',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'text/javascript' },
      innerHTML: `try{var c=localStorage.getItem('leshem-compact');if(c==='true')document.documentElement.setAttribute('data-reading','compact');}catch(e){}`,
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cinzel:wght@400;600;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&display=swap',
      },
    },
  ],

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
        gtag: {
          trackingID: 'G-8XJNSZMNEV',
          anonymizeIP: true,
        },
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
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        hideOnScroll: false,
        title: 'Leshem Shvo v\'Achlama',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'leshemSidebar',
            position: 'left',
            label: 'Table of Contents',
          },
          {
            href: 'https://ko-fi.com',
            label: '☕ Support this project',
            position: 'right',
          },
        ],
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: false,
        },
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

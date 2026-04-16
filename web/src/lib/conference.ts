/**
 * Conference constants — single source of truth.
 * Imported by Base layout (JSON-LD), Countdown, Footer, etc.
 */

export const CONFERENCE = {
  name: 'PGConf Poland 2026',
  shortName: 'PGConf Poland',
  description:
    'PGConf Poland 2026 — the PostgreSQL Europe community conference, taking place 24 November 2026 in the historic Old Town of Gdańsk.',
  date: '2026-11-24',
  startsAt: '2026-11-24T09:00:00+01:00',
  endsAt: '2026-11-24T18:00:00+01:00',
  dateLabel: '24 November 2026',
  venue: {
    name: 'ARCHE Dwór Uphagena Gdańsk',
    street: 'ul. Prof. Z. Kieturakisa 1',
    postalCode: '80-742',
    city: 'Gdańsk',
    country: 'Poland',
    countryCode: 'PL',
    latitude: 54.3477,
    longitude: 18.6647,
  },
  rooms: [
    'Sala Bastion Miś A+B+C',
    'Sala "U Profesora B"',
    'Foyer Sali Miś',
    'Stara Kuchnia',
    'Spiżarnia',
  ],
  organiser: {
    name: 'PostgreSQL Europe',
    address: '61 rue de Lyon, 75012 Paris, France',
    url: 'https://www.postgresql.eu/',
  },
  url: 'https://pgconf.pl',
  contactEmail: 'hello@pgconf.pl',
  social: {
    mastodon: 'https://mastodon.social/@pgconfpl',
    linkedin: 'https://www.linkedin.com/company/postgresql-europe/',
  },
  registrationOpens: '2026-06-01',
  registrationOpensLabel: '1 June 2026',
} as const;

export const NAV_PRIMARY = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/venue', label: 'Venue' },
  { href: '/cfp', label: 'Call for Papers' },
  { href: '/attendance', label: 'Your Attendance' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/organisation', label: 'Organisation' },
  { href: '/code-of-conduct', label: 'Code of Conduct' },
  { href: '/contact', label: 'Contact' },
] as const;

export const NAV_FOOTER = [
  { href: '/things-to-do', label: 'Things To Do in Gdańsk' },
  { href: '/visa-letter', label: 'Visa Letter' },
  { href: '/code-of-conduct', label: 'Code of Conduct' },
] as const;

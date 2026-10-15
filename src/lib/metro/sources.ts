/**
 * Official sources for the government information MetroNow shows (timetable,
 * routes, fares). Google Play's Misleading Claims policy requires apps that
 * present government information to link clearly to the original source, so
 * these are surfaced in the footer, the About sheet, the privacy policy and
 * next to fares. Update them together with the timetable data.
 */
export const OFFICIAL_SOURCE = {
  publisher: 'Gujarat Metro Rail Corporation (GMRC)',
  home: 'https://www.gujaratmetrorail.com/ahmedabad/',
  timetable: 'https://www.gujaratmetrorail.com/ahmedabad/wp-content/uploads/2026/05/Revised-Time-Table-on-18.05.2026updated.jpg',
  routesAndFares: 'https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/',
  fareRules: 'https://www.gujaratmetrorail.com/ahmedabad/fare-rules/',
} as const;

/**
 * Hand-curated Ahmedabad Metro station master.
 *
 * Source: coordinates and translated names are derived from OpenStreetMap
 * (Overpass export, see data-source/osm/*.geojson), cross-checked against the
 * GMRC master timetable in data-source/Ahmedabad_Metro_Master_Database_V2.xlsx.
 *
 * Line naming uses GMRC/OSM official names (Blue, Red, Yellow, Violet) rather
 * than any internal codename. The Red/Yellow interchange sits at Motera
 * Stadium — this matches both Wikipedia's "Red Line: 14 stations, APMC ↔
 * Motera Stadium" and the fare data's 14-entry Red index; Koteshwar Road is
 * the first Yellow-only station heading north. "PDEU" reflects the
 * university's current name (Pandit Deendayal Energy University).
 *
 * This file is a BUILD-TIME input only (read by scripts/build-network.ts).
 * The app never imports it directly — it consumes src/data/generated/*.json.
 *
 * IMPORTANT — corrected against the master timetable's real Station_Order
 * rows (the reference project's station list was wrong in two ways):
 *  1. "Sabarmati Railway Station" is a genuine, separate stop between Vadaj
 *     and AEC (confirmed via Wikipedia: a real elevated Red Line station,
 *     opened 6 Oct 2022, at 23.06979°N 72.58777°E) — entirely missing from
 *     the reference's 53-station master, which conflated it with "Sabarmati".
 *  2. The real stop order is …Vijay Nagar, Ranip, Vadaj, Sabarmati Railway
 *     Station, AEC, Sabarmati, Motera Stadium, Koteshwar Road — Ranip comes
 *     BEFORE Vadaj, the reverse of what the reference hardcoded (which is
 *     exactly the bug its fix_red_line.cjs patch script was papering over).
 *  3. Real L2 (Red) trips run all the way to Koteshwar Road (16 stops, not
 *     14) — Koteshwar Road is the genuine Red/Yellow interchange, not Motera
 *     Stadium as Wikipedia's summary table implies.
 */

export type LineId = 'blue' | 'red' | 'yellow' | 'violet';

export interface StationMasterEntry {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  lat: number;
  lng: number;
  lines: LineId[];
  isUnderground?: boolean;
  isInterchange?: boolean;
}

export const LINE_META: Record<
  LineId,
  { name: string; from: string; to: string; color: string; colorInk: 'light' | 'dark' }
> = {
  blue: { name: 'Blue Line', from: 'Thaltej Gam', to: 'Vastral Gam', color: '#0066CC', colorInk: 'light' },
  red: { name: 'Red Line', from: 'APMC', to: 'Koteshwar Road', color: '#DC2626', colorInk: 'light' },
  yellow: { name: 'Yellow Line', from: 'Koteshwar Road', to: 'Mahatma Mandir', color: '#F2B705', colorInk: 'dark' },
  violet: { name: 'Violet Line', from: 'GNLU', to: 'GIFT City', color: '#7C3AED', colorInk: 'light' },
};

/**
 * Canonical, physically-ordered station list per line. This is the
 * authoritative station membership + order — NOT derived from raw trip rows,
 * because Yellow/Violet trips through-run over Red track from APMC and would
 * otherwise pollute each line's station list with the other line's stops.
 * Verified against real sampled trip rows from the master timetable.
 */
export const LINE_ORDER: Record<LineId, string[]> = {
  blue: [
    'thaltej_gam', 'thaltej', 'doordarshan_kendra', 'gurukul_road', 'gujarat_university',
    'commerce_six_road', 'stadium', 'old_high_court', 'shahpur', 'gheekanta', 'kalupur',
    'kankaria_east', 'apparel_park', 'amraiwadi', 'rabari_colony', 'vastral',
    'nirant_cross_roads', 'vastral_gam',
  ],
  red: [
    'apmc', 'jivraj_park', 'rajiv_nagar', 'shreyas', 'paldi', 'gandhigram', 'old_high_court',
    'usmanpura', 'vijay_nagar', 'ranip', 'vadaj', 'sabarmati_railway_station', 'aec', 'sabarmati',
    'motera_stadium', 'koteshwar_road',
  ],
  yellow: [
    'koteshwar_road', 'vishwakarma_college', 'tapovan_circle', 'narmada_canal',
    'koba_circle', 'juna_koba', 'koba_gam', 'gnlu', 'raysan', 'randesan', 'dholakuva_circle',
    'infocity', 'sector_1', 'sector_10a', 'sachivalaya', 'akshardham', 'juna_sachivalaya',
    'sector_16', 'sector_24', 'mahatma_mandir',
  ],
  violet: ['gnlu', 'pdeu', 'gift_city'],
};

export const stationMaster: StationMasterEntry[] = [
  // Blue Line (East-West) — Thaltej Gam to Vastral Gam
  { id: 'thaltej_gam', name: 'Thaltej Gam', nameGu: 'થલતેજ ગામ', nameHi: 'थलतेज गाम', lat: 23.0502062, lng: 72.5070123, lines: ['blue'] },
  { id: 'thaltej', name: 'Thaltej', nameGu: 'થલતેજ', nameHi: 'थलतेज', lat: 23.049748, lng: 72.5160152, lines: ['blue'] },
  { id: 'doordarshan_kendra', name: 'Doordarshan Kendra', nameGu: 'દૂરદર્શન કેન્દ્ર', nameHi: 'दूरदर्शन केंद्र', lat: 23.0481764, lng: 72.5244209, lines: ['blue'] },
  { id: 'gurukul_road', name: 'Gurukul Road', nameGu: 'ગુરુકુલ રોડ', nameHi: 'गुरुकुल रोड', lat: 23.0458829, lng: 72.5348734, lines: ['blue'] },
  { id: 'gujarat_university', name: 'Gujarat University', nameGu: 'ગુજરાત યુનિવર્સિટી', nameHi: 'गुजरात यूनिवर्सिटी', lat: 23.0448477, lng: 72.5435296, lines: ['blue'] },
  { id: 'commerce_six_road', name: 'Commerce Six Road', nameGu: 'કોમર્સ છ રસ્તા', nameHi: 'कॉमर्स सिक्स रोड', lat: 23.0407013, lng: 72.552973, lines: ['blue'] },
  { id: 'stadium', name: 'S P Stadium', nameGu: 'સ્ટેડિયમ', nameHi: 'एस पी स्टेडियम', lat: 23.0398414, lng: 72.5616768, lines: ['blue'] },
  { id: 'old_high_court', name: 'Old High Court', nameGu: 'જૂની હાઇ કોર્ટ', nameHi: 'ओल्ड हाई कोर्ट', lat: 23.0372892, lng: 72.5672065, lines: ['blue', 'red'], isInterchange: true },
  { id: 'shahpur', name: 'Shahpur', nameGu: 'શાહપુર', nameHi: 'शाहपुर', lat: 23.0392105, lng: 72.5810327, lines: ['blue'], isUnderground: true },
  { id: 'gheekanta', name: 'Gheekanta', nameGu: 'ઘીકાંટા', nameHi: 'घीकांटा', lat: 23.028794, lng: 72.5867752, lines: ['blue'], isUnderground: true },
  { id: 'kalupur', name: 'Kalupur', nameGu: 'કાલુપુર', nameHi: 'कालूपुर', lat: 23.0246913, lng: 72.6031447, lines: ['blue'], isUnderground: true },
  { id: 'kankaria_east', name: 'Kankaria East', nameGu: 'કાંકરિયા ઈસ્ટ', nameHi: 'कांकरिया ईस्ट', lat: 23.0154573, lng: 72.6070016, lines: ['blue'], isUnderground: true },
  { id: 'apparel_park', name: 'Apparel Park', nameGu: 'એપરલ પાર્ક', nameHi: 'अपैरल पार्क', lat: 23.0106696, lng: 72.6180098, lines: ['blue'] },
  { id: 'amraiwadi', name: 'Amraiwadi', nameGu: 'અમરાઈવાડી', nameHi: 'अमराईवाड़ी', lat: 23.0076672, lng: 72.6287279, lines: ['blue'] },
  { id: 'rabari_colony', name: 'Rabari Colony', nameGu: 'રબારી કોલોની', nameHi: 'रबारी कॉलोनी', lat: 23.0054703, lng: 72.6354063, lines: ['blue'] },
  { id: 'vastral', name: 'Vastral', nameGu: 'વસ્ત્રાલ', nameHi: 'वस्त्राल', lat: 23.0035988, lng: 72.6475942, lines: ['blue'] },
  { id: 'nirant_cross_roads', name: 'Nirant Cross Roads', nameGu: 'નિરંત ક્રોસ રોડ', nameHi: 'निरंत क्रॉस रोड', lat: 22.9997169, lng: 72.658889, lines: ['blue'] },
  { id: 'vastral_gam', name: 'Vastral Gam', nameGu: 'વસ્ત્રાલ ગામ', nameHi: 'वस्त्राल गाम', lat: 22.9971397, lng: 72.667391, lines: ['blue'] },

  // Red Line (North-South) — APMC to Motera Stadium
  { id: 'apmc', name: 'APMC', nameGu: 'એ પી એમ સી', nameHi: 'ए पी एम सी', lat: 22.9977445, lng: 72.5371222, lines: ['red'] },
  { id: 'jivraj_park', name: 'Jivraj Park', nameGu: 'જીવરાજ પાર્ક', nameHi: 'जीवराज पार्क', lat: 23.0054989, lng: 72.5334928, lines: ['red'] },
  { id: 'rajiv_nagar', name: 'Rajiv Nagar', nameGu: 'રાજીવ નગર', nameHi: 'राजीव नगर', lat: 23.0097229, lng: 72.5367523, lines: ['red'] },
  { id: 'shreyas', name: 'Shreyas', nameGu: 'શ્રેયસ', nameHi: 'श्रेयस', lat: 23.0135977, lng: 72.5492225, lines: ['red'] },
  { id: 'paldi', name: 'Paldi', nameGu: 'પાલડી', nameHi: 'पालडी', lat: 23.0185053, lng: 72.5624076, lines: ['red'] },
  { id: 'gandhigram', name: 'Gandhigram', nameGu: 'ગાંધીગ્રામ', nameHi: 'गांधीग्राम', lat: 23.0270955, lng: 72.5690238, lines: ['red'] },
  { id: 'usmanpura', name: 'Usmanpura', nameGu: 'ઉસ્માનપુરા', nameHi: 'उस्मानपुरा', lat: 23.0458371, lng: 72.564982, lines: ['red'] },
  { id: 'vijay_nagar', name: 'Vijay Nagar', nameGu: 'વિજય નગર', nameHi: 'विजय नगर', lat: 23.0561913, lng: 72.5623389, lines: ['red'] },
  { id: 'ranip', name: 'Ranip', nameGu: 'રાણીપ', nameHi: 'राणीप', lat: 23.0676741, lng: 72.5740838, lines: ['red'] },
  { id: 'vadaj', name: 'Vadaj', nameGu: 'વાડજ', nameHi: 'वाडज', lat: 23.0676671, lng: 72.5657588, lines: ['red'] },
  { id: 'sabarmati_railway_station', name: 'Sabarmati Railway Station', nameGu: 'સાબરમતી રેલ્વે સ્ટેશન', nameHi: 'साबरमती रेलवे स्टेशन', lat: 23.06979, lng: 72.58777, lines: ['red'] },
  { id: 'aec', name: 'AEC', nameGu: 'એ ઇ સી', nameHi: 'ए ई सी', lat: 23.0751088, lng: 72.593291, lines: ['red'] },
  { id: 'sabarmati', name: 'Sabarmati', nameGu: 'સાબરમતી', nameHi: 'साबरमती', lat: 23.0856303, lng: 72.592206, lines: ['red'] },
  { id: 'motera_stadium', name: 'Motera Stadium', nameGu: 'મોટેરા સ્ટેડિયમ', nameHi: 'मोटेरा स्टेडियम', lat: 23.0967726, lng: 72.596692, lines: ['red'] },
  { id: 'koteshwar_road', name: 'Koteshwar Road', nameGu: 'કોટેશ્વર રોડ', nameHi: 'कोटेश्वर रोड', lat: 23.1031114, lng: 72.6021329, lines: ['red', 'yellow'], isInterchange: true },

  // Yellow Line — Koteshwar Road to Mahatma Mandir (via GNLU)
  { id: 'vishwakarma_college', name: 'Vishwakarma College', nameGu: 'વિશ્વકર્મા કોલેજ', nameHi: 'विश्वकर्मा कॉलेज', lat: 23.1141999, lng: 72.6083864, lines: ['yellow'] },
  { id: 'tapovan_circle', name: 'Tapovan Circle', nameGu: 'તપોવન સર્કલ', nameHi: 'तपोवन सर्कल', lat: 23.1201271, lng: 72.6157987, lines: ['yellow'] },
  { id: 'narmada_canal', name: 'Narmada Canal', nameGu: 'નર્મદા કેનાલ', nameHi: 'नर्मदा कैनाल', lat: 23.1251457, lng: 72.6220979, lines: ['yellow'] },
  { id: 'koba_circle', name: 'Koba Circle', nameGu: 'કોબા સર્કલ', nameHi: 'कोबा सर्कल', lat: 23.1322508, lng: 72.631042, lines: ['yellow'] },
  { id: 'juna_koba', name: 'Juna Koba', nameGu: 'જૂના કોબા', nameHi: 'जूना कोबा', lat: 23.1419718, lng: 72.6386122, lines: ['yellow'] },
  { id: 'koba_gam', name: 'Koba Gam', nameGu: 'કોબા ગામ', nameHi: 'कोबा गाम', lat: 23.1476098, lng: 72.6439055, lines: ['yellow'] },
  { id: 'gnlu', name: 'GNLU', nameGu: 'જી એન એલ યુ', nameHi: 'जी एन एल यू', lat: 23.1544724, lng: 72.6474689, lines: ['yellow', 'violet'], isInterchange: true },
  { id: 'raysan', name: 'Raysan', nameGu: 'રાયસન', nameHi: 'रायसन', lat: 23.1663954, lng: 72.6483252, lines: ['yellow'] },
  { id: 'randesan', name: 'Randesan', nameGu: 'રાંદેસણ', nameHi: 'रांदेसण', lat: 23.1790845, lng: 72.6472905, lines: ['yellow'] },
  { id: 'dholakuva_circle', name: 'Dholakuva Circle', nameGu: 'ધોળાકુવા સર્કલ', nameHi: 'धोलाकुवा सर्कल', lat: 23.1859445, lng: 72.6433202, lines: ['yellow'] },
  { id: 'infocity', name: 'Infocity', nameGu: 'ઇન્ફોસિટી', nameHi: 'इन्फोसिटी', lat: 23.1922574, lng: 72.6397126, lines: ['yellow'] },
  { id: 'sector_1', name: 'Sector-1', nameGu: 'સેક્ટર-1', nameHi: 'सेक्टर-1', lat: 23.2049077, lng: 72.6431519, lines: ['yellow'] },
  { id: 'sector_10a', name: 'Sector-10A', nameGu: 'સેક્ટર-10એ', nameHi: 'सेक्टर-10ए', lat: 23.2114841, lng: 72.6501927, lines: ['yellow'] },
  { id: 'sachivalaya', name: 'Sachivalaya', nameGu: 'સચિવાલય', nameHi: 'सचिवालय', lat: 23.2150688, lng: 72.6587511, lines: ['yellow'] },
  { id: 'akshardham', name: 'Akshardham', nameGu: 'અક્ષરધામ', nameHi: 'अक्षरधाम', lat: 23.2236772, lng: 72.6641817, lines: ['yellow'] },
  { id: 'juna_sachivalaya', name: 'Juna Sachivalaya', nameGu: 'જૂના સચિવાલય', nameHi: 'जूना सचिवालय', lat: 23.228926, lng: 72.6594151, lines: ['yellow'] },
  { id: 'sector_16', name: 'Sector 16', nameGu: 'સેક્ટર-16', nameHi: 'सेक्टर-16', lat: 23.2338826, lng: 72.6501659, lines: ['yellow'] },
  { id: 'sector_24', name: 'Sector 24', nameGu: 'સેક્ટર-24', nameHi: 'सेक्टर-24', lat: 23.2385075, lng: 72.6414782, lines: ['yellow'] },
  { id: 'mahatma_mandir', name: 'Mahatma Mandir', nameGu: 'મહાત્મા મંદિર', nameHi: 'महात्मा मंदिर', lat: 23.2339412, lng: 72.6338714, lines: ['yellow'] },

  // Violet Line — GNLU to GIFT City
  { id: 'pdeu', name: 'PDEU', nameGu: 'પી ડી ઈ યુ', nameHi: 'पी डी ई यू', lat: 23.1548645, lng: 72.6612117, lines: ['violet'] },
  { id: 'gift_city', name: 'GIFT City', nameGu: 'ગિફ્ટ સિટી', nameHi: 'गिफ्ट सिटी', lat: 23.1533555, lng: 72.6855536, lines: ['violet'] },
];

export const stationById = new Map(stationMaster.map(s => [s.id, s]));

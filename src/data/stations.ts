import type { Station, Route, PresetRoute } from '../types';

// Real train stations with actual coordinates
export const stations: Record<string, Station> = {
  // Japan - Shinkansen
  'tokyo': {
    id: 'tokyo',
    name: 'Tokyo Station',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 35.6812, lng: 139.7671 },
    timezone: 'Asia/Tokyo',
    funFacts: [
      'Tokyo Station handles over 3,000 trains daily',
      'The original red brick building dates from 1914',
      'It has over 100 different ekiben (train bento) varieties'
    ]
  },
  'kyoto': {
    id: 'kyoto',
    name: 'Kyoto Station',
    city: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 34.9858, lng: 135.7588 },
    timezone: 'Asia/Tokyo',
    funFacts: [
      'The current station building was designed by Hiroshi Hara',
      'Kyoto was Japan\'s capital for over 1,000 years',
      'The station has a rooftop garden with city views'
    ]
  },
  'osaka': {
    id: 'osaka',
    name: 'Shin-Osaka Station',
    city: 'Osaka',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 34.7334, lng: 135.5001 },
    timezone: 'Asia/Tokyo',
    funFacts: [
      'Shin-Osaka is the main Shinkansen station for Osaka',
      'Osaka is known as Japan\'s kitchen for its street food',
      'The station connects to 4 different rail lines'
    ]
  },
  'hiroshima': {
    id: 'hiroshima',
    name: 'Hiroshima Station',
    city: 'Hiroshima',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 34.3983, lng: 132.4756 },
    timezone: 'Asia/Tokyo',
    funFacts: [
      'Hiroshima is famous for okonomiyaki and momiji manju',
      'The Peace Memorial Park is a short tram ride away',
      'Miyajima Island\'s famous torii gate is nearby'
    ]
  },

  // Europe - Major hubs
  'paris-nord': {
    id: 'paris-nord',
    name: 'Paris Gare du Nord',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    coordinates: { lat: 48.8809, lng: 2.3553 },
    timezone: 'Europe/Paris',
    funFacts: [
      'Busiest railway station in Europe by passenger numbers',
      'The facade features 23 statues representing destinations',
      'Over 700,000 passengers pass through daily'
    ]
  },
  'paris-lyon': {
    id: 'paris-lyon',
    name: 'Paris Gare de Lyon',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    coordinates: { lat: 48.8443, lng: 2.3745 },
    timezone: 'Europe/Paris',
    funFacts: [
      'Home to the famous Le Train Bleu restaurant',
      'Clock tower is a Paris landmark since 1900',
      'Departure point for TGV trains to the south'
    ]
  },
  'amsterdam': {
    id: 'amsterdam',
    name: 'Amsterdam Centraal',
    city: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    coordinates: { lat: 52.3791, lng: 4.9003 },
    timezone: 'Europe/Amsterdam',
    funFacts: [
      'Built on 3 artificial islands using 8,687 wooden piles',
      'The station building was designed by Pierre Cuypers',
      'Over 250,000 passengers use it daily'
    ]
  },
  'london-stpancras': {
    id: 'london-stpancras',
    name: 'London St Pancras',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    coordinates: { lat: 51.5305, lng: -0.1260 },
    timezone: 'Europe/London',
    funFacts: [
      'Home to Europe\'s longest champagne bar',
      'The Victorian Gothic architecture nearly faced demolition',
      'Features a 9-meter bronze statue called The Meeting Place'
    ]
  },
  'brussels': {
    id: 'brussels',
    name: 'Brussels-Midi',
    city: 'Brussels',
    country: 'Belgium',
    countryCode: 'BE',
    coordinates: { lat: 50.8354, lng: 4.3365 },
    timezone: 'Europe/Brussels',
    funFacts: [
      'Main international station for high-speed trains',
      'Connects to 6 different countries by rail',
      'Originally opened in 1869'
    ]
  },
  'berlin': {
    id: 'berlin',
    name: 'Berlin Hauptbahnhof',
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    coordinates: { lat: 52.5251, lng: 13.3694 },
    timezone: 'Europe/Berlin',
    funFacts: [
      'Largest train station in Europe by floor space',
      'Opened in 2006 on the site of old Lehrter Bahnhof',
      'Features tracks on 5 different levels'
    ]
  },
  'munich': {
    id: 'munich',
    name: 'München Hauptbahnhof',
    city: 'Munich',
    country: 'Germany',
    countryCode: 'DE',
    coordinates: { lat: 48.1403, lng: 11.5601 },
    timezone: 'Europe/Berlin',
    funFacts: [
      'One of the largest terminal stations in Germany',
      'Serves as gateway to the Bavarian Alps',
      'Originally opened in 1839'
    ]
  },
  'zurich': {
    id: 'zurich',
    name: 'Zürich Hauptbahnhof',
    city: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    coordinates: { lat: 47.3778, lng: 8.5403 },
    timezone: 'Europe/Zurich',
    funFacts: [
      'Largest railway station in Switzerland',
      'Famous for its punctual Swiss trains',
      'Underground shopping mall spans 3 floors'
    ]
  },
  'vienna': {
    id: 'vienna',
    name: 'Wien Hauptbahnhof',
    city: 'Vienna',
    country: 'Austria',
    countryCode: 'AT',
    coordinates: { lat: 48.1854, lng: 16.3785 },
    timezone: 'Europe/Vienna',
    funFacts: [
      'Opened in 2014 as a new central station',
      'Diamond-shaped roof is an architectural landmark',
      'Connects all rail lines through Vienna'
    ]
  },
  'milan': {
    id: 'milan',
    name: 'Milano Centrale',
    city: 'Milan',
    country: 'Italy',
    countryCode: 'IT',
    coordinates: { lat: 45.4861, lng: 9.2047 },
    timezone: 'Europe/Rome',
    funFacts: [
      'One of Europe\'s largest railway stations',
      'Built in 1931 with monumental architecture',
      'Features Art Nouveau and Art Deco elements'
    ]
  },
  'rome': {
    id: 'rome',
    name: 'Roma Termini',
    city: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    coordinates: { lat: 41.9010, lng: 12.5016 },
    timezone: 'Europe/Rome',
    funFacts: [
      'Largest station in Italy with 29 platforms',
      'Named after ancient Baths of Diocletian nearby',
      'Over 480,000 passengers daily'
    ]
  },
  'barcelona': {
    id: 'barcelona',
    name: 'Barcelona Sants',
    city: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    coordinates: { lat: 41.3790, lng: 2.1400 },
    timezone: 'Europe/Madrid',
    funFacts: [
      'Main high-speed rail station for Barcelona',
      'Connects to AVE trains to Madrid in 2.5 hours',
      'Underground expansion completed in 2007'
    ]
  },
  'madrid': {
    id: 'madrid',
    name: 'Madrid Atocha',
    city: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    coordinates: { lat: 40.4065, lng: -3.6893 },
    timezone: 'Europe/Madrid',
    funFacts: [
      'Features a tropical garden inside the old terminal',
      'Home to a population of turtles in the garden pond',
      'Oldest railway station in Madrid since 1851'
    ]
  },

  // USA - Northeast Corridor
  'nyc-penn': {
    id: 'nyc-penn',
    name: 'Penn Station',
    city: 'New York City',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 40.7506, lng: -73.9935 },
    timezone: 'America/New_York',
    funFacts: [
      'Busiest transportation hub in the Western Hemisphere',
      'Located directly beneath Madison Square Garden',
      'Over 600,000 passengers pass through daily'
    ]
  },
  'boston-south': {
    id: 'boston-south',
    name: 'Boston South Station',
    city: 'Boston',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 42.3519, lng: -71.0552 },
    timezone: 'America/New_York',
    funFacts: [
      'Largest train station in New England',
      'Original building dates from 1899',
      'Featured in many Hollywood films'
    ]
  },
  'washington-union': {
    id: 'washington-union',
    name: 'Union Station',
    city: 'Washington D.C.',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 38.8976, lng: -77.0065 },
    timezone: 'America/New_York',
    funFacts: [
      'Beaux-Arts architecture opened in 1907',
      'Most visited destination in Washington D.C.',
      'Fully restored in 1988 after years of decline'
    ]
  },
  'chicago-union': {
    id: 'chicago-union',
    name: 'Chicago Union Station',
    city: 'Chicago',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 41.8789, lng: -87.6400 },
    timezone: 'America/Chicago',
    funFacts: [
      'Famous Great Hall featured in The Untouchables',
      'Only remaining intercity train station in Chicago',
      'Opened in 1925 after 12 years of construction'
    ]
  },

  // Trans-Siberian
  'moscow': {
    id: 'moscow',
    name: 'Yaroslavsky Station',
    city: 'Moscow',
    country: 'Russia',
    countryCode: 'RU',
    coordinates: { lat: 55.7743, lng: 37.6567 },
    timezone: 'Europe/Moscow',
    funFacts: [
      'Terminus for Trans-Siberian Railway',
      'Art Nouveau building from 1902-1904',
      'Platform 2 is the start of the world\'s longest railway'
    ]
  },
  'yekaterinburg': {
    id: 'yekaterinburg',
    name: 'Yekaterinburg Station',
    city: 'Yekaterinburg',
    country: 'Russia',
    countryCode: 'RU',
    coordinates: { lat: 56.8580, lng: 60.6025 },
    timezone: 'Asia/Yekaterinburg',
    funFacts: [
      'Marks the border between Europe and Asia',
      'Russia\'s fourth-largest city',
      'Important stop on the Trans-Siberian Railway'
    ]
  },
  'novosibirsk': {
    id: 'novosibirsk',
    name: 'Novosibirsk Station',
    city: 'Novosibirsk',
    country: 'Russia',
    countryCode: 'RU',
    coordinates: { lat: 55.0283, lng: 82.9211 },
    timezone: 'Asia/Novosibirsk',
    funFacts: [
      'Largest station in Siberia',
      'Third most populous city in Russia',
      'Station building resembles a green Soviet-era locomotive'
    ]
  },
  'irkutsk': {
    id: 'irkutsk',
    name: 'Irkutsk Station',
    city: 'Irkutsk',
    country: 'Russia',
    countryCode: 'RU',
    coordinates: { lat: 52.2855, lng: 104.2890 },
    timezone: 'Asia/Irkutsk',
    funFacts: [
      'Gateway to Lake Baikal, deepest lake in the world',
      'Known as the Paris of Siberia',
      'Beautiful wooden architecture in the old town'
    ]
  },
  'vladivostok': {
    id: 'vladivostok',
    name: 'Vladivostok Station',
    city: 'Vladivostok',
    country: 'Russia',
    countryCode: 'RU',
    coordinates: { lat: 43.1150, lng: 131.8855 },
    timezone: 'Asia/Vladivostok',
    funFacts: [
      'Eastern terminus of the Trans-Siberian Railway',
      'Journey from Moscow: 9,289 km over 7 days',
      'Station building mirrors Yaroslavsky in Moscow'
    ]
  },

  // India
  'mumbai-cst': {
    id: 'mumbai-cst',
    name: 'Chhatrapati Shivaji Terminus',
    city: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    coordinates: { lat: 18.9398, lng: 72.8355 },
    timezone: 'Asia/Kolkata',
    funFacts: [
      'UNESCO World Heritage Site since 2004',
      'Victorian Gothic architecture from 1888',
      'One of the busiest railway stations in India'
    ]
  },
  'delhi': {
    id: 'delhi',
    name: 'New Delhi Station',
    city: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    coordinates: { lat: 28.6424, lng: 77.2194 },
    timezone: 'Asia/Kolkata',
    funFacts: [
      'One of the largest railway stations in India',
      'Handles over 300 trains daily',
      'Main station for trains to Agra and the Taj Mahal'
    ]
  },

  // China
  'beijing': {
    id: 'beijing',
    name: 'Beijing South Station',
    city: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    coordinates: { lat: 39.8652, lng: 116.3783 },
    timezone: 'Asia/Shanghai',
    funFacts: [
      'Largest railway station in Asia by floor area',
      'Roof covered in solar panels',
      'High-speed trains to Shanghai in 4.5 hours'
    ]
  },
  'shanghai': {
    id: 'shanghai',
    name: 'Shanghai Hongqiao',
    city: 'Shanghai',
    country: 'China',
    countryCode: 'CN',
    coordinates: { lat: 31.1949, lng: 121.3190 },
    timezone: 'Asia/Shanghai',
    funFacts: [
      'Part of world\'s largest transport hub',
      'Handles over 600 high-speed trains daily',
      'Connected directly to Hongqiao Airport'
    ]
  },

  // Australia
  'sydney': {
    id: 'sydney',
    name: 'Sydney Central Station',
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    coordinates: { lat: -33.8832, lng: 151.2061 },
    timezone: 'Australia/Sydney',
    funFacts: [
      'Largest and busiest station in Australia',
      'Heritage-listed clock tower from 1906',
      'Features in many Australian films'
    ]
  },
  'melbourne': {
    id: 'melbourne',
    name: 'Melbourne Southern Cross',
    city: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    coordinates: { lat: -37.8183, lng: 144.9525 },
    timezone: 'Australia/Melbourne',
    funFacts: [
      'Distinctive wave-like roof design',
      'Won multiple architecture awards',
      'Main terminus for interstate trains'
    ]
  },
};

// Real travel times between stations (actual train journey times)
export const routes: Route[] = [
  // Japan - Shinkansen (bullet train)
  {
    id: 'tokyo-kyoto',
    from: 'tokyo',
    to: 'kyoto',
    travelTimeMinutes: 135, // Nozomi: 2h 15m
    distanceKm: 476,
    trainType: 'Shinkansen Nozomi',
    routeName: 'Tokaido Shinkansen'
  },
  {
    id: 'kyoto-osaka',
    from: 'kyoto',
    to: 'osaka',
    travelTimeMinutes: 15, // Very quick
    distanceKm: 43,
    trainType: 'Shinkansen Nozomi',
    routeName: 'Tokaido Shinkansen'
  },
  {
    id: 'osaka-hiroshima',
    from: 'osaka',
    to: 'hiroshima',
    travelTimeMinutes: 80, // About 1h 20m
    distanceKm: 342,
    trainType: 'Shinkansen Sakura',
    routeName: 'Sanyo Shinkansen'
  },
  {
    id: 'tokyo-osaka',
    from: 'tokyo',
    to: 'osaka',
    travelTimeMinutes: 150, // 2h 30m
    distanceKm: 515,
    trainType: 'Shinkansen Nozomi',
    routeName: 'Tokaido Shinkansen'
  },

  // Europe - High-speed
  {
    id: 'paris-amsterdam',
    from: 'paris-nord',
    to: 'amsterdam',
    travelTimeMinutes: 195, // 3h 15m
    distanceKm: 540,
    trainType: 'Thalys',
    routeName: 'Thalys Paris-Amsterdam'
  },
  {
    id: 'paris-london',
    from: 'paris-nord',
    to: 'london-stpancras',
    travelTimeMinutes: 135, // 2h 15m
    distanceKm: 459,
    trainType: 'Eurostar',
    routeName: 'Eurostar'
  },
  {
    id: 'london-brussels',
    from: 'london-stpancras',
    to: 'brussels',
    travelTimeMinutes: 120, // 2h
    distanceKm: 373,
    trainType: 'Eurostar',
    routeName: 'Eurostar'
  },
  {
    id: 'brussels-amsterdam',
    from: 'brussels',
    to: 'amsterdam',
    travelTimeMinutes: 110, // 1h 50m
    distanceKm: 211,
    trainType: 'Thalys',
    routeName: 'Thalys'
  },
  {
    id: 'paris-brussels',
    from: 'paris-nord',
    to: 'brussels',
    travelTimeMinutes: 82, // 1h 22m
    distanceKm: 312,
    trainType: 'Thalys',
    routeName: 'Thalys'
  },
  {
    id: 'berlin-munich',
    from: 'berlin',
    to: 'munich',
    travelTimeMinutes: 240, // 4h
    distanceKm: 584,
    trainType: 'ICE',
    routeName: 'ICE Berlin-Munich'
  },
  {
    id: 'munich-zurich',
    from: 'munich',
    to: 'zurich',
    travelTimeMinutes: 240, // 4h
    distanceKm: 320,
    trainType: 'EuroCity',
    routeName: 'EC München-Zürich'
  },
  {
    id: 'zurich-milan',
    from: 'zurich',
    to: 'milan',
    travelTimeMinutes: 195, // 3h 15m
    distanceKm: 280,
    trainType: 'EuroCity',
    routeName: 'EC Gotthard'
  },
  {
    id: 'milan-rome',
    from: 'milan',
    to: 'rome',
    travelTimeMinutes: 175, // 2h 55m
    distanceKm: 572,
    trainType: 'Frecciarossa',
    routeName: 'Frecciarossa'
  },
  {
    id: 'vienna-munich',
    from: 'vienna',
    to: 'munich',
    travelTimeMinutes: 240, // 4h
    distanceKm: 440,
    trainType: 'Railjet',
    routeName: 'ÖBB Railjet'
  },
  {
    id: 'madrid-barcelona',
    from: 'madrid',
    to: 'barcelona',
    travelTimeMinutes: 150, // 2h 30m
    distanceKm: 621,
    trainType: 'AVE',
    routeName: 'AVE Madrid-Barcelona'
  },
  {
    id: 'paris-milan',
    from: 'paris-lyon',
    to: 'milan',
    travelTimeMinutes: 420, // 7h
    distanceKm: 850,
    trainType: 'TGV',
    routeName: 'TGV Lyria + EC'
  },

  // USA - Northeast Corridor
  {
    id: 'nyc-boston',
    from: 'nyc-penn',
    to: 'boston-south',
    travelTimeMinutes: 210, // 3h 30m Acela
    distanceKm: 350,
    trainType: 'Acela Express',
    routeName: 'Acela Express'
  },
  {
    id: 'nyc-washington',
    from: 'nyc-penn',
    to: 'washington-union',
    travelTimeMinutes: 165, // 2h 45m Acela
    distanceKm: 362,
    trainType: 'Acela Express',
    routeName: 'Acela Express'
  },
  {
    id: 'boston-washington',
    from: 'boston-south',
    to: 'washington-union',
    travelTimeMinutes: 390, // 6h 30m
    distanceKm: 725,
    trainType: 'Acela Express',
    routeName: 'Acela Express'
  },
  {
    id: 'chicago-nyc',
    from: 'chicago-union',
    to: 'nyc-penn',
    travelTimeMinutes: 1140, // 19h Lake Shore Limited
    distanceKm: 1550,
    trainType: 'Lake Shore Limited',
    routeName: 'Lake Shore Limited'
  },

  // Trans-Siberian segments
  {
    id: 'moscow-yekaterinburg',
    from: 'moscow',
    to: 'yekaterinburg',
    travelTimeMinutes: 1560, // 26h
    distanceKm: 1816,
    trainType: 'Trans-Siberian',
    routeName: 'Trans-Siberian Railway'
  },
  {
    id: 'yekaterinburg-novosibirsk',
    from: 'yekaterinburg',
    to: 'novosibirsk',
    travelTimeMinutes: 1200, // 20h
    distanceKm: 1524,
    trainType: 'Trans-Siberian',
    routeName: 'Trans-Siberian Railway'
  },
  {
    id: 'novosibirsk-irkutsk',
    from: 'novosibirsk',
    to: 'irkutsk',
    travelTimeMinutes: 1260, // 21h
    distanceKm: 1858,
    trainType: 'Trans-Siberian',
    routeName: 'Trans-Siberian Railway'
  },
  {
    id: 'irkutsk-vladivostok',
    from: 'irkutsk',
    to: 'vladivostok',
    travelTimeMinutes: 3360, // 56h
    distanceKm: 4091,
    trainType: 'Trans-Siberian',
    routeName: 'Trans-Siberian Railway'
  },

  // India
  {
    id: 'mumbai-delhi',
    from: 'mumbai-cst',
    to: 'delhi',
    travelTimeMinutes: 960, // 16h Rajdhani
    distanceKm: 1384,
    trainType: 'Rajdhani Express',
    routeName: 'Rajdhani Express'
  },

  // China
  {
    id: 'beijing-shanghai',
    from: 'beijing',
    to: 'shanghai',
    travelTimeMinutes: 270, // 4h 30m
    distanceKm: 1318,
    trainType: 'CRH Fuxing',
    routeName: 'Beijing-Shanghai High-Speed'
  },

  // Australia
  {
    id: 'sydney-melbourne',
    from: 'sydney',
    to: 'melbourne',
    travelTimeMinutes: 660, // 11h
    distanceKm: 878,
    trainType: 'XPT',
    routeName: 'Sydney-Melbourne XPT'
  },
];

// Preset routes for quick selection
export const presetRoutes: PresetRoute[] = [
  // Short sessions (15-30 min)
  {
    id: 'preset-kyoto-osaka',
    name: 'Quick Kyoto Dash',
    description: 'A quick 15-minute bullet train ride between ancient Kyoto and vibrant Osaka',
    category: 'short',
    stationIds: ['kyoto', 'osaka']
  },

  // Medium sessions (45-90 min)
  {
    id: 'preset-osaka-hiroshima',
    name: 'Sakura Sprint',
    description: 'Speed through western Japan on the Sanyo Shinkansen',
    category: 'medium',
    stationIds: ['osaka', 'hiroshima']
  },
  {
    id: 'preset-paris-brussels',
    name: 'Thalys Express',
    description: 'Zip between two European capitals in under 90 minutes',
    category: 'medium',
    stationIds: ['paris-nord', 'brussels']
  },

  // Long sessions (90-180 min)
  {
    id: 'preset-tokyo-kyoto',
    name: 'Nozomi Journey',
    description: 'The classic Shinkansen experience from Tokyo to Kyoto',
    category: 'long',
    stationIds: ['tokyo', 'kyoto']
  },
  {
    id: 'preset-paris-london',
    name: 'Eurostar Crossing',
    description: 'Cross the English Channel in style via the Channel Tunnel',
    category: 'long',
    stationIds: ['paris-nord', 'london-stpancras']
  },
  {
    id: 'preset-madrid-barcelona',
    name: 'AVE Adventure',
    description: 'Spain\'s high-speed AVE train across the Iberian Peninsula',
    category: 'long',
    stationIds: ['madrid', 'barcelona']
  },
  {
    id: 'preset-milan-rome',
    name: 'Frecciarossa Flight',
    description: 'Italy\'s red arrow zips between the fashion and eternal cities',
    category: 'long',
    stationIds: ['milan', 'rome']
  },

  // Epic journeys (multi-station)
  {
    id: 'preset-japan-traverse',
    name: 'Japan Traverse',
    description: 'Cross Japan from Tokyo through Kyoto and Osaka to Hiroshima',
    category: 'epic',
    stationIds: ['tokyo', 'kyoto', 'osaka', 'hiroshima']
  },
  {
    id: 'preset-european-triangle',
    name: 'European Triangle',
    description: 'London, Paris, and Brussels - three capitals, one journey',
    category: 'epic',
    stationIds: ['london-stpancras', 'paris-nord', 'brussels', 'amsterdam']
  },
  {
    id: 'preset-trans-siberian',
    name: 'Trans-Siberian Epic',
    description: 'The legendary journey across Russia - 9,289km, 7 days',
    category: 'epic',
    stationIds: ['moscow', 'yekaterinburg', 'novosibirsk', 'irkutsk', 'vladivostok']
  },
  {
    id: 'preset-northeast-corridor',
    name: 'Northeast Corridor',
    description: 'Boston to Washington via New York on the Acela Express',
    category: 'epic',
    stationIds: ['boston-south', 'nyc-penn', 'washington-union']
  },
  {
    id: 'preset-italian-journey',
    name: 'Italian Journey',
    description: 'Milan to Rome - from Alps to ancient ruins',
    category: 'long',
    stationIds: ['milan', 'rome']
  },
];

// Helper to find a route between two stations
export function findRoute(fromId: string, toId: string): Route | undefined {
  return routes.find(
    r => (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId)
  );
}

// Helper to get all stations connected to a station
export function getConnectedStations(stationId: string): string[] {
  const connected = new Set<string>();
  routes.forEach(route => {
    if (route.from === stationId) connected.add(route.to);
    if (route.to === stationId) connected.add(route.from);
  });
  return Array.from(connected);
}

// Helper to calculate total journey time for multiple stations
export function calculateJourneyTime(stationIds: string[]): number {
  let totalMinutes = 0;
  for (let i = 0; i < stationIds.length - 1; i++) {
    const route = findRoute(stationIds[i], stationIds[i + 1]);
    if (route) {
      totalMinutes += route.travelTimeMinutes;
    }
  }
  return totalMinutes;
}

// Helper to calculate total journey distance
export function calculateJourneyDistance(stationIds: string[]): number {
  let totalKm = 0;
  for (let i = 0; i < stationIds.length - 1; i++) {
    const route = findRoute(stationIds[i], stationIds[i + 1]);
    if (route) {
      totalKm += route.distanceKm;
    }
  }
  return totalKm;
}

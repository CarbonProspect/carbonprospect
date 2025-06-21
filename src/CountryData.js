/**
 * CountryData.js
 * 
 * This file contains geographic data for countries around the world, including:
 * - Coordinates (centroids)
 * - Region and subregion information
 * - Bilateral agreement status information
 * 
 * Used as a centralized source of geographic information for all map components
 */

// Country centroid coordinates (latitude, longitude)
export const countryCoordinates = {
  // Africa
  'Algeria': [28.0339, 1.6596],
  'Angola': [-11.2027, 17.8739],
  'Benin': [9.3077, 2.3158],
  'Botswana': [-22.3285, 24.6849],
  'Burkina Faso': [12.2383, -1.5616],
  'Burundi': [-3.3731, 29.9189],
  'Cameroon': [7.3697, 12.3547],
  'Cape Verde': [16.5388, -23.0418],
  'Central African Republic': [6.6111, 20.9394],
  'Chad': [15.4542, 18.7322],
  'Comoros': [-11.6455, 43.3333],
  'Congo': [-0.2280, 15.8277],
  'Djibouti': [11.8251, 42.5903],
  'DR Congo': [-4.0383, 21.7587],
  'Egypt': [26.8206, 30.8025],
  'Equatorial Guinea': [1.6508, 10.2679],
  'Eritrea': [15.1794, 39.7823],
  'Eswatini': [-26.5225, 31.4659],
  'Ethiopia': [9.1450, 40.4897],
  'Gabon': [-0.8037, 11.6094],
  'Gambia': [13.4432, -15.3101],
  'Ghana': [7.9465, -1.0232],
  'Guinea': [9.9456, -9.6966],
  'Guinea-Bissau': [11.8037, -15.1804],
  'Ivory Coast': [7.5400, -5.5471],
  'Kenya': [0.0236, 37.9062],
  'Lesotho': [-29.6100, 28.2336],
  'Liberia': [6.4281, -9.4295],
  'Libya': [26.3351, 17.2283],
  'Madagascar': [-18.7669, 46.8691],
  'Malawi': [-13.2543, 34.3015],
  'Mali': [17.5707, -3.9962],
  'Mauritania': [21.0079, -10.9408],
  'Mauritius': [-20.3484, 57.5522],
  'Morocco': [31.7917, -7.0926],
  'Mozambique': [-18.6657, 35.5296],
  'Namibia': [-22.9576, 18.4904],
  'Niger': [17.6078, 8.0817],
  'Nigeria': [9.0820, 8.6753],
  'Rwanda': [-1.9403, 29.8739],
  'Sao Tome and Principe': [0.1864, 6.6131],
  'Senegal': [14.4974, -14.4524],
  'Seychelles': [-4.6796, 55.4920],
  'Sierra Leone': [8.4606, -11.7799],
  'Somalia': [5.1521, 46.1996],
  'South Africa': [-30.5595, 22.9375],
  'South Sudan': [6.8770, 31.3070],
  'Sudan': [12.8628, 30.2176],
  'Tanzania': [-6.3690, 34.8888],
  'Togo': [8.6195, 0.8248],
  'Tunisia': [33.8869, 9.5375],
  'Uganda': [1.3733, 32.2903],
  'Zambia': [-13.1339, 27.8493],
  'Zimbabwe': [-19.0154, 29.1549],
  // Americas
  'Antigua and Barbuda': [17.0608, -61.7964],
  'Argentina': [-38.4161, -63.6167],
  'Bahamas': [25.0343, -77.3963],
  'Barbados': [13.1939, -59.5432],
  'Belize': [17.1899, -88.4976],
  'Bolivia': [-16.2902, -63.5887],
  'Brazil': [-14.2350, -51.9253],
  'Canada': [56.1304, -106.3468],
  'Chile': [-35.6751, -71.5430],
  'Colombia': [4.5709, -74.2973],
  'Costa Rica': [9.7489, -83.7534],
  'Cuba': [21.5218, -77.7812],
  'Dominica': [15.4150, -61.3710],
  'Dominican Republic': [18.7357, -70.1627],
  'Ecuador': [-1.8312, -78.1834],
  'El Salvador': [13.7942, -88.8965],
  'Grenada': [12.1165, -61.6790],
  'Guatemala': [15.7835, -90.2308],
  'Guyana': [4.8604, -58.9302],
  'Haiti': [18.9712, -72.2852],
  'Honduras': [15.2000, -86.2419],
  'Jamaica': [18.1096, -77.2975],
  'Mexico': [23.6345, -102.5528],
  'Nicaragua': [12.8654, -85.2072],
  'Panama': [8.5380, -80.7821],
  'Paraguay': [-23.4425, -58.4438],
  'Peru': [-9.1900, -75.0152],
  'Saint Kitts and Nevis': [17.3578, -62.7830],
  'Saint Lucia': [13.9094, -60.9789],
  'Saint Vincent and the Grenadines': [13.2528, -61.1971],
  'Suriname': [3.9193, -56.0278],
  'Trinidad and Tobago': [10.6918, -61.2225],
  'United States': [37.0902, -95.7129],
  'Uruguay': [-32.5228, -55.7658],
  'Venezuela': [6.4238, -66.5897],
  
  // Asia
  'Afghanistan': [33.9391, 67.7100],
  'Armenia': [40.0691, 45.0382],
  'Azerbaijan': [40.1431, 47.5769],
  'Bahrain': [25.9304, 50.6378],
  'Bangladesh': [23.6850, 90.3563],
  'Bhutan': [27.5142, 90.4336],
  'Brunei': [4.5353, 114.7277],
  'Cambodia': [12.5657, 104.9910],
  'China': [35.8617, 104.1954],
  'Cyprus': [35.1264, 33.4299],
  'Georgia': [42.3154, 43.3569],
  'India': [20.5937, 78.9629],
  'Indonesia': [-0.7893, 113.9213],
  'Iran': [32.4279, 53.6880],
  'Iraq': [33.2232, 43.6793],
  'Israel': [31.0461, 34.8516],
  'Japan': [36.2048, 138.2529],
  'Jordan': [30.5852, 36.2384],
  'Kazakhstan': [48.0196, 66.9237],
  'Kuwait': [29.3117, 47.4818],
  'Kyrgyzstan': [41.2044, 74.7661],
  'Lao PDR': [19.8563, 102.4955],
  'Laos': [19.8563, 102.4955],
  'Malaysia': [4.2105, 101.9758],
  'Mongolia': [46.8625, 103.8467],
  'Myanmar': [21.9162, 95.9560],
  'Nepal': [28.3949, 84.1240],
  'North Korea': [40.3399, 127.5101],
  'Oman': [21.4735, 55.9754],
  'Pakistan': [30.3753, 69.3451],
  'Palestine': [31.9522, 35.2332],
  'Philippines': [12.8797, 121.7740],
  'Qatar': [25.3548, 51.1839],
  'Republic of Korea': [35.9078, 127.7669],
  'Saudi Arabia': [23.8859, 45.0792],
  'Singapore': [1.3521, 103.8198],
  'Sri Lanka': [7.8731, 80.7718],
  'Syria': [34.8021, 38.9968],
  'Taiwan': [23.6978, 120.9605],
  'Tajikistan': [38.8610, 71.2761],
  'Thailand': [15.8700, 100.9925],
  'Timor-Leste': [-8.8742, 125.7275],
  'Turkey': [38.9637, 35.2433],
  'Turkmenistan': [38.9697, 59.5563],
  'United Arab Emirates': [23.4241, 53.8478],
  'Uzbekistan': [41.3775, 64.5853],
  'Vietnam': [14.0583, 108.2772],
  'Yemen': [15.5527, 48.5164],
  
  // Europe
  'Albania': [41.1533, 20.1683],
  'Andorra': [42.5063, 1.5218],
  'Austria': [47.5162, 14.5501],
  'Belarus': [53.7098, 27.9534],
  'Belgium': [50.5039, 4.4699],
  'Bosnia and Herzegovina': [43.9159, 17.6791],
  'Bulgaria': [42.7339, 25.4858],
  'Croatia': [45.1000, 15.2000],
  'Czech Republic': [49.8175, 15.4730],
  'Denmark': [56.2639, 9.5018],
  'Estonia': [58.5953, 25.0136],
  'Finland': [61.9241, 25.7482],
  'France': [46.2276, 2.2137],
  'Germany': [51.1657, 10.4515],
  'Greece': [39.0742, 21.8243],
  'Hungary': [47.1625, 19.5033],
  'Iceland': [64.9631, -19.0208],
  'Ireland': [53.1424, -7.6921],
  'Italy': [41.8719, 12.5674],
  'Latvia': [56.8796, 24.6032],
  'Liechtenstein': [47.1660, 9.5554],
  'Lithuania': [55.1694, 23.8813],
  'Luxembourg': [49.8153, 6.1296],
  'Malta': [35.9375, 14.3754],
  'Moldova': [47.4116, 28.3699],
  'Monaco': [43.7384, 7.4246],
  'Montenegro': [42.7087, 19.3744],
  'Netherlands': [52.1326, 5.2913],
  'North Macedonia': [41.6086, 21.7453],
  'Norway': [60.4720, 8.4689],
  'Poland': [51.9194, 19.1451],
  'Portugal': [39.3999, -8.2245],
  'Romania': [45.9432, 24.9668],
  'Russia': [61.5240, 105.3188],
  'San Marino': [43.9424, 12.4578],
  'Serbia': [44.0165, 21.0059],
  'Slovakia': [48.6690, 19.6990],
  'Slovenia': [46.1512, 14.9955],
  'Spain': [40.4637, -3.7492],
  'Sweden': [60.1282, 18.6435],
  'Switzerland': [46.8182, 8.2275],
  'Ukraine': [48.3794, 31.1656],
  'United Kingdom': [55.3781, -3.4360],
  'Vatican City': [41.9029, 12.4534],
  
  // Oceania
  'Australia': [-25.2744, 133.7751],
  'Fiji': [-17.7134, 178.0650],
  'Kiribati': [1.8709, -157.3676],
  'Marshall Islands': [7.1315, 171.1845],
  'Micronesia': [7.4256, 150.5508],
  'Nauru': [-0.5228, 166.9315],
  'New Zealand': [-40.9006, 174.8860],
  'Palau': [7.5150, 134.5825],
  'Papua New Guinea': [-6.3150, 143.9555],
  'Samoa': [-13.7590, -172.1046],
  'Solomon Islands': [-9.6457, 160.1562],
  'Tonga': [-21.1790, -175.1982],
  'Tuvalu': [-7.1095, 177.6493],
  'Vanuatu': [-15.3767, 166.9592],
  
  // Common alternate names and specific territories
  'USA': [37.0902, -95.7129],
  'UK': [55.3781, -3.4360],
  'South Korea': [35.9078, 127.7669],
  'Côte d\'Ivoire': [7.5400, -5.5471],
  'Ivory Coast': [7.5400, -5.5471],
  'Democratic Republic of the Congo': [-4.0383, 21.7587],
  'Republic of the Congo': [-0.2280, 15.8277],
  'Czech Republic': [49.8175, 15.4730],
  'United States of America': [37.0902, -95.7129],
  'Tanzania': [-6.3690, 34.8888],
  'Czechia': [49.8175, 15.4730]
};

// Information about bilateral agreement status
export const bilateralAgreementStatus = {
  // Full bilateral agreements (implemented)
  IMPLEMENTED: 'implemented',
  // MoU signed but no implementation yet
  MOU_ONLY: 'mou_only',
  // In negotiation but no formal agreement
  IN_NEGOTIATION: 'in_negotiation'
};

// Country region classification
export const countryRegions = {
  'Ghana': { region: 'Africa', subRegion: 'Western Africa' },
  'Peru': { region: 'Americas', subRegion: 'South America' },
  'Senegal': { region: 'Africa', subRegion: 'Western Africa' },
  'Thailand': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Vanuatu': { region: 'Oceania', subRegion: 'Melanesia' },
  'Kenya': { region: 'Africa', subRegion: 'Eastern Africa' },
  'Morocco': { region: 'Africa', subRegion: 'Northern Africa' },
  'Dominican Republic': { region: 'Americas', subRegion: 'Caribbean' },
  'Georgia': { region: 'Asia', subRegion: 'Western Asia' },
  'Costa Rica': { region: 'Americas', subRegion: 'Central America' },
  'Rwanda': { region: 'Africa', subRegion: 'Eastern Africa' },
  'China': { region: 'Asia', subRegion: 'Eastern Asia' },
  'Uzbekistan': { region: 'Asia', subRegion: 'Central Asia' },
  'Indonesia': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Chile': { region: 'Americas', subRegion: 'South America' },
  'Switzerland': { region: 'Europe', subRegion: 'Western Europe' },
  'Japan': { region: 'Asia', subRegion: 'Eastern Asia' },
  'Singapore': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Fiji': { region: 'Oceania', subRegion: 'Melanesia' },
  'Malawi': { region: 'Africa', subRegion: 'Eastern Africa' },
  'Panama': { region: 'Americas', subRegion: 'Central America' },
  'Uruguay': { region: 'Americas', subRegion: 'South America' },
  'Philippines': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Paraguay': { region: 'Americas', subRegion: 'South America' },
  'Vietnam': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Colombia': { region: 'Americas', subRegion: 'South America' },
  'Cambodia': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Bhutan': { region: 'Asia', subRegion: 'Southern Asia' },
  'Tunisia': { region: 'Africa', subRegion: 'Northern Africa' },
  'Lao PDR': { region: 'Asia', subRegion: 'Southeast Asia' },
  'Mongolia': { region: 'Asia', subRegion: 'Eastern Asia' },
  'Sri Lanka': { region: 'Asia', subRegion: 'Southern Asia' },
  'Papua New Guinea': { region: 'Oceania', subRegion: 'Melanesia' },
  'Republic of Korea': { region: 'Asia', subRegion: 'Eastern Asia' },
  'United Arab Emirates': { region: 'Asia', subRegion: 'Western Asia' },
  'Sweden': { region: 'Europe', subRegion: 'Northern Europe' },
  'Norway': { region: 'Europe', subRegion: 'Northern Europe' },
  'Australia': { region: 'Oceania', subRegion: 'Australia and New Zealand' },
  'Palau': { region: 'Oceania', subRegion: 'Micronesia' }
};

// Get the location of a country by name
export const getCountryLocation = (countryName) => {
  if (!countryName) return null;
  
  // Try exact match first
  if (countryCoordinates[countryName]) {
    return countryCoordinates[countryName];
  }
  
  // Try case-insensitive match
  const lowerCaseName = countryName.toLowerCase();
  const countryKey = Object.keys(countryCoordinates).find(key => 
    key.toLowerCase() === lowerCaseName
  );
  
  if (countryKey) {
    return countryCoordinates[countryKey];
  }
  
  // Return null if no match found
  console.warn(`Could not find coordinates for country: ${countryName}`);
  return null;
};

// Get region and subregion information for a country
export const getCountryRegionInfo = (countryName) => {
  if (!countryName) return null;
  
  // Try exact match first
  if (countryRegions[countryName]) {
    return countryRegions[countryName];
  }
  
  // Try case-insensitive match
  const lowerCaseName = countryName.toLowerCase();
  const countryKey = Object.keys(countryRegions).find(key => 
    key.toLowerCase() === lowerCaseName
  );
  
  if (countryKey) {
    return countryRegions[countryKey];
  }
  
  // Return default region info if not found
  console.warn(`Could not find region info for country: ${countryName}`);
  return { region: 'Unknown', subRegion: 'Unknown' };
};

// Export all functions and data
export default {
  countryCoordinates,
  bilateralAgreementStatus,
  countryRegions,
  getCountryLocation,
  getCountryRegionInfo
};
export const geoData = {
  India: {
    code: 'IN',
    flag: '🇮🇳',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'English',
    states: {
      Maharashtra: {
        districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
      },
      Gujarat: {
        districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
      },
      Karnataka: {
        districts: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Tumkur'],
      },
      'Tamil Nadu': {
        districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'],
      },
      Rajasthan: {
        districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
      },
    },
  },
  'United States': {
    code: 'US',
    flag: '🇺🇸',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    language: 'English',
    states: {
      California: {
        districts: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Fresno', 'Sacramento'],
      },
      Texas: {
        districts: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
      },
      Florida: {
        districts: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'Boca Raton'],
      },
      'New York': {
        districts: ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers'],
      },
    },
  },
  'United Arab Emirates': {
    code: 'AE',
    flag: '🇦🇪',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    language: 'Arabic',
    states: {
      Dubai: {
        districts: ['Downtown Dubai', 'Deira', 'Bur Dubai', 'Jumeirah', 'Al Quoz', 'Dubai Silicon Oasis'],
      },
      'Abu Dhabi': {
        districts: ['Abu Dhabi City', 'Al Ain', 'Khalifa City', 'Musaffah', 'Ruwais'],
      },
      Sharjah: {
        districts: ['Sharjah City', 'Khor Fakkan', 'Dibba Al Hisn', 'Kalba'],
      },
    },
  },
  'United Kingdom': {
    code: 'GB',
    flag: '🇬🇧',
    currency: 'GBP',
    timezone: 'Europe/London',
    language: 'English',
    states: {
      England: {
        districts: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Sheffield', 'Bristol'],
      },
      Scotland: {
        districts: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
      },
      Wales: {
        districts: ['Cardiff', 'Swansea', 'Newport', 'Wrexham'],
      },
    },
  },
  Australia: {
    code: 'AU',
    flag: '🇦🇺',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    language: 'English',
    states: {
      'New South Wales': {
        districts: ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Albury', 'Wagga Wagga'],
      },
      Victoria: {
        districts: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton'],
      },
      Queensland: {
        districts: ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns'],
      },
    },
  },
  Germany: {
    code: 'DE',
    flag: '🇩🇪',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    language: 'German',
    states: {
      Bavaria: {
        districts: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Ingolstadt'],
      },
      'North Rhine-Westphalia': {
        districts: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bonn'],
      },
      Berlin: {
        districts: ['Mitte', 'Charlottenburg', 'Prenzlauer Berg', 'Kreuzberg', 'Neukölln'],
      },
    },
  },
  'South Africa': {
    code: 'ZA',
    flag: '🇿🇦',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    language: 'English',
    states: {
      Gauteng: {
        districts: ['Johannesburg', 'Pretoria', 'Soweto', 'Ekurhuleni', 'Centurion'],
      },
      'Western Cape': {
        districts: ['Cape Town', 'Stellenbosch', 'George', 'Paarl', 'Worcester'],
      },
      'KwaZulu-Natal': {
        districts: ['Durban', 'Pietermaritzburg', 'Richards Bay', 'Newcastle'],
      },
    },
  },
  Singapore: {
    code: 'SG',
    flag: '🇸🇬',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    language: 'English',
    states: {
      'Central Region': {
        districts: ['Orchard', 'Marina Bay', 'Toa Payoh', 'Bishan', 'Novena'],
      },
      'West Region': {
        districts: ['Jurong East', 'Clementi', 'Boon Lay', 'Bukit Batok'],
      },
      'North Region': {
        districts: ['Woodlands', 'Sembawang', 'Yishun', 'Admiralty'],
      },
    },
  },
};

export const countries = Object.entries(geoData).map(([name, data]) => ({
  id: `country-${data.code.toLowerCase()}`,
  name,
  code: data.code,
  flag: data.flag,
  currency: data.currency,
  timezone: data.timezone,
  language: data.language,
  states: Object.keys(data.states),
}));

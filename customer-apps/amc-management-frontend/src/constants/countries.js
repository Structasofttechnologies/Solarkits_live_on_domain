// src/constants/countries.js

export const ALL_COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR (₹)',
    currencySymbol: '₹',
    currencyCode: 'INR',
    dialCode: '+91',
    taxLabel: 'GSTIN',
    taxPlaceholder: '24AABCS1234A1Z5',
    active: true,
    isDefault: true,
    states: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh',
      'Jammu and Kashmir', 'Ladakh', 'Puducherry'
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED (د.إ)',
    currencySymbol: 'AED',
    currencyCode: 'AED',
    dialCode: '+971',
    taxLabel: 'TRN / VAT ID',
    taxPlaceholder: '100123456700003',
    active: true,
    states: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD ($)',
    currencySymbol: '$',
    currencyCode: 'USD',
    dialCode: '+1',
    taxLabel: 'EIN / Tax ID',
    taxPlaceholder: '12-3456789',
    active: true,
    states: ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'Arizona', 'Washington']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP (£)',
    currencySymbol: '£',
    currencyCode: 'GBP',
    dialCode: '+44',
    taxLabel: 'VAT Reg No',
    taxPlaceholder: 'GB 123 4567 89',
    active: true,
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland']
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR (ر.س)',
    currencySymbol: 'SAR',
    currencyCode: 'SAR',
    dialCode: '+966',
    taxLabel: 'VAT Number',
    taxPlaceholder: '300123456700003',
    active: true,
    states: ['Riyadh', 'Makkah', 'Eastern Province', 'Madinah', 'Asir', 'Tabuk', 'Al Qassim']
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR (€)',
    currencySymbol: '€',
    currencyCode: 'EUR',
    dialCode: '+49',
    taxLabel: 'USt-IdNr',
    taxPlaceholder: 'DE123456789',
    active: true,
    states: ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Berlin', 'Hamburg', 'Saxony']
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD ($)',
    currencySymbol: '$',
    currencyCode: 'AUD',
    dialCode: '+61',
    taxLabel: 'ABN / ACN',
    taxPlaceholder: '12 345 678 901',
    active: true,
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania']
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD ($)',
    currencySymbol: '$',
    currencyCode: 'SGD',
    dialCode: '+65',
    taxLabel: 'UEN / GST Reg No',
    taxPlaceholder: '201234567M',
    active: true,
    states: ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region']
  },
  {
    code: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    currency: 'QAR (ر.ق)',
    currencySymbol: 'QAR',
    currencyCode: 'QAR',
    dialCode: '+974',
    taxLabel: 'Tax Card No',
    taxPlaceholder: '0000123456789',
    active: true,
    states: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal']
  },
  {
    code: 'OM',
    name: 'Oman',
    flag: '🇴🇲',
    currency: 'OMR (ر.ع.)',
    currencySymbol: 'OMR',
    currencyCode: 'OMR',
    dialCode: '+968',
    taxLabel: 'VAT Account No',
    taxPlaceholder: 'OM12345678',
    active: true,
    states: ['Muscat', 'Dhofar', 'Al Batinah North', 'Al Batinah South', 'Al Dakhiliyah']
  },
  {
    code: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    currency: 'KWD (د.ك)',
    currencySymbol: 'KWD',
    currencyCode: 'KWD',
    dialCode: '+965',
    taxLabel: 'Civil ID / Tax No',
    taxPlaceholder: '123456789012',
    active: true,
    states: ['Al Asimah', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra', 'Mubarak Al-Kabeer']
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD ($)',
    currencySymbol: '$',
    currencyCode: 'CAD',
    dialCode: '+1',
    taxLabel: 'GST/HST Reg No',
    taxPlaceholder: '123456789 RT 0001',
    active: true,
    states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia']
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR (R)',
    currencySymbol: 'R',
    currencyCode: 'ZAR',
    dialCode: '+27',
    taxLabel: 'VAT Registration No',
    taxPlaceholder: '4123456789',
    active: true,
    states: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga']
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES (KSh)',
    currencySymbol: 'KSh',
    currencyCode: 'KES',
    dialCode: '+254',
    taxLabel: 'KRA PIN',
    taxPlaceholder: 'P051234567Z',
    active: true,
    states: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Uasin Gishu']
  }
];

export const OPERATIONAL_COUNTRIES = ALL_COUNTRIES.filter(c => c.active);

export function getCountryByName(name) {
  if (!name) return ALL_COUNTRIES[0];
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase()) || ALL_COUNTRIES[0];
}

export function getCountryByCode(code) {
  if (!code) return ALL_COUNTRIES[0];
  return ALL_COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase()) || ALL_COUNTRIES[0];
}

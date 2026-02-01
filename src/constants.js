// Default color thresholds based on Beaufort scale for different units

// Default color thresholds based on Beaufort scale (MPH)
export const DEFAULT_THRESHOLDS_MPH = [
  { value: 0,  color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm (< 1 mph)
  { value: 1,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air (1-3 mph)
  { value: 4,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze (4-7 mph)
  { value: 8,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze (8-12 mph)
  { value: 13, color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze (13-18 mph)
  { value: 19, color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze (19-24 mph)
  { value: 25, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze (25-31 mph)
  { value: 32, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale (32-38 mph)
  { value: 39, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale (39-46 mph)
  { value: 47, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale (47-54 mph)
  { value: 55, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm (55-63 mph)
  { value: 64, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm (64-72 mph)
  { value: 73, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force (>= 73 mph)
];

// Default color thresholds based on Beaufort scale (m/s - meters per second)
export const DEFAULT_THRESHOLDS_MS = [
  { value: 0,    color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm (< 0.3 m/s)
  { value: 0.3,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air (0.3-1.5 m/s)
  { value: 1.6,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze (1.6-3.3 m/s)
  { value: 3.4,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze (3.4-5.4 m/s)
  { value: 5.5,  color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze (5.5-7.9 m/s)
  { value: 8.0,  color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze (8.0-10.7 m/s)
  { value: 10.8, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze (10.8-13.8 m/s)
  { value: 13.9, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale (13.9-17.1 m/s)
  { value: 17.2, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale (17.2-20.7 m/s)
  { value: 20.8, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale (20.8-24.4 m/s)
  { value: 24.5, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm (24.5-28.4 m/s)
  { value: 28.5, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm (28.5-32.6 m/s)
  { value: 32.7, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force (>= 32.7 m/s)
];

// Default color thresholds based on Beaufort scale (km/h - kilometers per hour)
export const DEFAULT_THRESHOLDS_KMH = [
  { value: 0,   color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm (< 1 km/h)
  { value: 1,   color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air (1-5 km/h)
  { value: 6,   color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze (6-11 km/h)
  { value: 12,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze (12-19 km/h)
  { value: 20,  color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze (20-28 km/h)
  { value: 29,  color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze (29-38 km/h)
  { value: 39,  color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze (39-49 km/h)
  { value: 50,  color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale (50-61 km/h)
  { value: 62,  color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale (62-74 km/h)
  { value: 75,  color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale (75-88 km/h)
  { value: 89,  color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm (89-102 km/h)
  { value: 103, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm (103-117 km/h)
  { value: 118, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force (>= 118 km/h)
];

// Default color thresholds based on Beaufort scale (knots - nautical)
export const DEFAULT_THRESHOLDS_KTS = [
  { value: 0,  color: 'rgba(187, 222, 251, 1)' },  // Force 0: Calm (< 1 kn)
  { value: 1,  color: 'rgba(144, 202, 249, 1)' },  // Force 1: Light Air (1-3 kn)
  { value: 4,  color: 'rgba(100, 181, 246, 1)' },  // Force 2: Light Breeze (4-6 kn)
  { value: 7,  color: 'rgba(66, 165, 245, 1)' },   // Force 3: Gentle Breeze (7-10 kn)
  { value: 11, color: 'rgba(30, 136, 229, 1)' },   // Force 4: Moderate Breeze (11-16 kn)
  { value: 17, color: 'rgba(192, 202, 81, 1)' },   // Force 5: Fresh Breeze (17-21 kn)
  { value: 22, color: 'rgba(225, 213, 60, 1)' },   // Force 6: Strong Breeze (22-27 kn)
  { value: 28, color: 'rgba(255, 213, 79, 1)' },   // Force 7: Near Gale (28-33 kn)
  { value: 34, color: 'rgba(255, 183, 77, 1)' },   // Force 8: Gale (34-40 kn)
  { value: 41, color: 'rgba(239, 108, 0, 1)' },    // Force 9: Strong Gale (41-47 kn)
  { value: 48, color: 'rgba(244, 81, 30, 1)' },    // Force 10: Storm (48-55 kn)
  { value: 56, color: 'rgba(229, 57, 53, 1)' },    // Force 11: Violent Storm (56-63 kn)
  { value: 64, color: 'rgba(183, 28, 28, 1)' }     // Force 12: Hurricane Force (>= 64 kn)
];

// Backward compatibility alias
export const DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS_MPH;

/**
 * Get appropriate default thresholds based on unit of measurement.
 * @param {string} unit - The unit of measurement (mph, m/s, km/h, kn, etc.)
 * @returns {Array} - Array of threshold objects with value and color properties
 */
export function getDefaultThresholdsForUnit(unit) {
  if (!unit) return DEFAULT_THRESHOLDS_MPH;
  const u = unit.toLowerCase().trim();
  if (u === 'm/s' || u === 'mps') return DEFAULT_THRESHOLDS_MS;
  if (u === 'km/h' || u === 'kph' || u === 'kmh') return DEFAULT_THRESHOLDS_KMH;
  if (u === 'kn' || u === 'kt' || u === 'kts' || u === 'knot' || u === 'knots') return DEFAULT_THRESHOLDS_KTS;
  return DEFAULT_THRESHOLDS_MPH;
}

// Card version
export const VERSION = '0.5.0';

export type Breakpoint = {
    cLow: number;
    cHigh: number;
    iLow: number;
    iHigh: number;
};

// Pollutant definitions based on US EPA standards
const BREAKPOINTS: Record<string, Breakpoint[]> = {
    pm25: [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
        { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
    ],
    pm10: [
        { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
        { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
        { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
        { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
        { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
        { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
        { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
    ],
    co: [ // ppm
        { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
        { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
        { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
        { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
        { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
        { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
        { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 },
    ],
    so2: [ // ppb
        { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
        { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
        { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
        { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
        { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
        { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
        { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 },
    ],
    no2: [ // ppb
        { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
        { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
        { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
        { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
        { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
        { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
        { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 },
    ],
    o3: [ // ppb (8-hour) - simplified
        { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
        { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
        { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
        { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
        { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
    ],
};

export function calculateSubIndex(concentration: number, pollutant: string): number {
    const breakpoints = BREAKPOINTS[pollutant];
    if (!breakpoints) return 0;

    // Find range
    const range = breakpoints.find(b => concentration >= b.cLow && concentration <= b.cHigh);

    if (!range) {
        // If out of range, just cap it or return max of last range
        if (concentration > breakpoints[breakpoints.length - 1].cHigh) return 500;
        return 0;
    }

    // Linear Interpolation Formula:
    // Ip = [(IHi - ILo) / (BPHi - BPLo)] * (Cp - BPLo) + ILo
    const slope = (range.iHigh - range.iLow) / (range.cHigh - range.cLow);
    const result = slope * (concentration - range.cLow) + range.iLow;

    return Math.round(result);
}

export function calculateAQI(data: { pm25: number; pm10: number; co: number; so2: number; no2: number; o3: number }): number {
    const subIndices = [
        calculateSubIndex(data.pm25, 'pm25'),
        calculateSubIndex(data.pm10, 'pm10'),
        calculateSubIndex(data.co, 'co'),
        calculateSubIndex(data.so2, 'so2'),
        calculateSubIndex(data.no2, 'no2'),
        calculateSubIndex(data.o3, 'o3'),
    ];

    // Overall AQI is the maximum of all sub-indices
    return Math.max(...subIndices);
}

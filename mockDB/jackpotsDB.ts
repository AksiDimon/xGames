export type JackpotKey = 'bronze' | 'silver' | 'gold';

export type JackpotMock = {
  key: JackpotKey;
  label: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  digits: number[]; // всегда 8 цифр (0..9)
  value: number; // то же самое числом (для удобства)
};

export const JACKPOTS_MOCK: JackpotMock[] = [
  {
    key: 'bronze',
    label: 'BRONZE',
    value: 2311,
    digits: [0, 0, 0, 2, 3, 1, 1, 1], // "00023111"
  },
  {
    key: 'silver',
    label: 'SILVER',
    value: 5311,
    digits: [0, 0, 0, 5, 3, 1, 1, 1], // "00053111"
  },
  {
    key: 'gold',
    label: 'GOLD',
    value: 10312,
    digits: [1, 9, 1, 0, 3, 1, 2, 0], // "00103120"
  },
  {
    key: 'bronze',
    label: 'DIAMOND',
    value: 2311,
    digits: [1, 0, 1, 2, 3, 1, 4, 1], // "00023111"
  },
];

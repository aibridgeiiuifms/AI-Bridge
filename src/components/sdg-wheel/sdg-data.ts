/**
 * sdg-data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All SDG colour definitions (official UN palette) and the four campaign-target
 * SDGs with their detailed descriptions. Kept pure so it can be imported in
 * both client and server contexts without bundling Framer Motion.
 */

// ─── Official UN SDG colour palette ──────────────────────────────────────────

export const SDG_COLOR: Record<number, string> = {
  1:  '#E5243B',
  2:  '#DDA63A',
  3:  '#4C9F38',
  4:  '#C5192D',
  5:  '#FF3A21',
  6:  '#26BDE2',
  7:  '#FCC30B',
  8:  '#A21942',
  9:  '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
};

export const SDG_SHORT_LABEL: Record<number, string> = {
  1:  'No Poverty',
  2:  'Zero Hunger',
  3:  'Good Health',
  4:  'Quality Education',
  5:  'Gender Equality',
  6:  'Clean Water',
  7:  'Clean Energy',
  8:  'Decent Work',
  9:  'Industry',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities',
  12: 'Responsible Consumption',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life On Land',
  16: 'Peace & Justice',
  17: 'Partnerships',
};

// ─── Campaign-target SDGs ─────────────────────────────────────────────────────

export interface TargetSdg {
  readonly num: number;
  readonly title: string;
  readonly color: string;
  readonly description: string;
  readonly centerPos: { x: number; y: number };
  readonly targetRotation: number;
}

export const TARGET_SDGS: readonly TargetSdg[] = [
  {
    num: 4,
    title: 'Goal 4: Quality Education',
    color: SDG_COLOR[4],
    centerPos: { x: 143.312, y: -40.775 },
    targetRotation: -74.12,
    description:
      'Empowers non-IT humanities classrooms — Sharia, Arabic, Urdu, and Usuluddin — with source-grounded Audio Overviews and dynamic study guides, making advanced learning materials universally accessible.',
  },
  {
    num: 8,
    title: 'Goal 8: Decent Work & Economic Growth',
    color: SDG_COLOR[8],
    centerPos: { x: 53.824, y: 138.939 },
    targetRotation: -158.82,
    description:
      'Directly combats educator burnout by automating repetitive lecture preparation and administrative formatting, saving faculty 3–5 hours weekly and redirecting that time toward meaningful student engagement.',
  },
  {
    num: 10,
    title: 'Goal 10: Reduced Inequalities',
    color: SDG_COLOR[10],
    centerPos: { x: -53.824, y: 138.939 },
    targetRotation: 158.82,
    description:
      'Democratises AI tools beyond computer-science labs so that religious, legal, and linguistic scholars gain the same modern technological capabilities as their STEM counterparts.',
  },
  {
    num: 17,
    title: 'Goal 17: Partnerships for the Goals',
    color: SDG_COLOR[17],
    centerPos: { x: -27.378, y: -146.463 },
    targetRotation: 10.59,
    description:
      'Builds institutional bridges connecting FMS ambassadors, participating faculties, and national youth platforms under the Hum Hain Pakistan campaign to scale impact nationwide.',
  },
] as const;

/** Fast O(1) set-membership check for the 4 highlighted SDGs */
export const TARGET_SDG_NUMS = new Set(TARGET_SDGS.map((t) => t.num));

/** The 13 sectors that never leave the wheel */
export const STATIC_SDG_NUMS: number[] = Array.from(
  { length: 17 },
  (_, i) => i + 1,
).filter((n) => !TARGET_SDG_NUMS.has(n));

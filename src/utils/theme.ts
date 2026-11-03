/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EyeComfortTheme = 'paper-warm' | 'soft-sage' | 'midnight-slate';

export interface ThemeConfig {
  id: EyeComfortTheme;
  name: string;
  subtitle: string;
  icon: string;
  badge: string;
  bgClass: string;
  cardBgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
}

export const EYE_COMFORT_THEMES: Record<EyeComfortTheme, ThemeConfig> = {
  'paper-warm': {
    id: 'paper-warm',
    name: 'Paper Warm',
    subtitle: 'Warm sepia & amber tint — filters out blue light',
    icon: '📜',
    badge: 'Eye Care Warm',
    bgClass: 'bg-[#FBF8F1]',
    cardBgClass: 'bg-[#FFFDF9]',
    borderClass: 'border-[#EAE1CF]',
    textClass: 'text-[#2D2A26]',
    accentClass: 'text-amber-700',
  },
  'soft-sage': {
    id: 'soft-sage',
    name: 'Soft Sage',
    subtitle: 'Restful botanical green — reduces visual fatigue',
    icon: '🌿',
    badge: 'Relaxing Green',
    bgClass: 'bg-[#F3F7F4]',
    cardBgClass: 'bg-white',
    borderClass: 'border-[#D5E5DA]',
    textClass: 'text-[#1F2B24]',
    accentClass: 'text-emerald-700',
  },
  'midnight-slate': {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    subtitle: 'Low-luminance OLED slate — zero glare at night',
    icon: '🌙',
    badge: 'Night Comfort',
    bgClass: 'bg-[#12161A]',
    cardBgClass: 'bg-[#1A2027]',
    borderClass: 'border-[#2C3742]',
    textClass: 'text-[#E2E8F0]',
    accentClass: 'text-sky-400',
  },
};

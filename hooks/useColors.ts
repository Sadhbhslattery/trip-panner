import { useContext } from 'react';
import { TripContext } from '@/app/_layout';

const light = {
  bg: '#FFF8FA',
  card: '#FFFFFF',
  border: '#F0C6D4',
  text: '#1F1126',
  textSoft: '#6B7280',
  textFaint: '#9CA3AF',
  accent: '#D4537E',
  accentSoft: '#FFF0F5',
  input: '#FFFFFF',
  inputBorder: '#F0C6D4',
  danger: '#DC2626',
  success: '#2E9E6B',
  trackBg: '#F3F4F6',
};

const dark = {
  bg: '#1A0E1E',
  card: '#2A1830',
  border: '#4A2D50',
  text: '#F5E6F0',
  textSoft: '#B89EC4',
  textFaint: '#7A6284',
  accent: '#E86A98',
  accentSoft: '#3D1F35',
  input: '#2A1830',
  inputBorder: '#4A2D50',
  danger: '#F87171',
  success: '#4ADE80',
  trackBg: '#3D1F35',
};

export function useColors() {
  const context = useContext(TripContext);
  if (!context) return light;
  return context.isDark ? dark : light;
}

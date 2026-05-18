import { CropProfile, WeatherLog, FarmPlan } from '../types';

const API = {
  profiles: '/api/krishi_profiles.php',
  weather:  '/api/krishi_weather.php',
  plans:    '/api/krishi_plans.php',
};

export const storage = {
  getProfiles: async (): Promise<CropProfile[]> => {
    try { const res = await fetch(API.profiles); return res.ok ? res.json() : []; } catch { return []; }
  },
  createProfile: (p: CropProfile): void => {
    fetch(API.profiles, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(console.error);
  },
  updateProfile: (p: CropProfile): void => {
    fetch(`${API.profiles}?id=${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(console.error);
  },
  deleteProfile: (id: string): void => {
    fetch(`${API.profiles}?id=${id}`, { method: 'DELETE' }).catch(console.error);
  },

  getWeatherLogs: async (): Promise<WeatherLog[]> => {
    try { const res = await fetch(API.weather); return res.ok ? res.json() : []; } catch { return []; }
  },
  addWeatherLog: (log: WeatherLog): void => {
    fetch(API.weather, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) }).catch(console.error);
  },
  deleteWeatherLog: (id: string): void => {
    fetch(`${API.weather}?id=${id}`, { method: 'DELETE' }).catch(console.error);
  },

  getPlans: async (): Promise<FarmPlan[]> => {
    try { const res = await fetch(API.plans); return res.ok ? res.json() : []; } catch { return []; }
  },
  addPlan: (plan: FarmPlan): void => {
    fetch(API.plans, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) }).catch(console.error);
  },
  updatePlanStatus: (id: string, status: 'pending' | 'completed'): void => {
    fetch(`${API.plans}?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(console.error);
  },
  deletePlan: (id: string): void => {
    fetch(`${API.plans}?id=${id}`, { method: 'DELETE' }).catch(console.error);
  },

  clearAllData: (): void => { /* handled elsewhere */ },
};

export const calculateAge = (startDate: string, endDate?: string): number => {
  const start = new Date(startDate);
  const now = endDate ? new Date(endDate) : new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
};

export const formatCurrency = (amount: number): string =>
  amount.toLocaleString('bn-BD') + ' টাকা';

import { useAuthStore } from '../stores/auth';

// 통화 포맷팅 유틸리티
export const formatCurrency = (amount) => {
  const authStore = useAuthStore();
  const currency = authStore.user?.currency || 'KRW';
  
  const currencyMap = {
    'KRW': { locale: 'ko-KR', currency: 'KRW' },
    'USD': { locale: 'en-US', currency: 'USD' },
    'EUR': { locale: 'de-DE', currency: 'EUR' },
    'JPY': { locale: 'ja-JP', currency: 'JPY' }
  };
  
  const config = currencyMap[currency] || currencyMap['KRW'];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency
  }).format(amount);
};

// 통화 심볼만 반환
export const getCurrencySymbol = () => {
  const authStore = useAuthStore();
  const currency = authStore.user?.currency || 'KRW';
  
  const symbols = {
    'KRW': '₩',
    'USD': '$',
    'EUR': '€',
    'JPY': '¥'
  };
  
  return symbols[currency] || '₩';
};



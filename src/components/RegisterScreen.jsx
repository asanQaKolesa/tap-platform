import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase через переменные окружения Vercel / Vite
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ПОЛНЫЙ СПИСОК ГОРОДОВ КАЗАХСТАНА (все ключевые центры e-commerce и селлеров)
const CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Усть-Каменогорск',
  'Семей',
  'Атырау',
  'Костанай',
  'Кызылорда',
  'Уральск',
  'Петропавловск',
  'Актау',
  'Темиртау',
  'Туркестан',
  'Кокшетау',
  'Талдыкорган',
  'Экибастуз',
  'Другой город / Весь Казахстан',
];

const NICHES = [
  'Электроника',
  'Дом и сад',
  'Одежда и обувь',
  'Детские товары',
  'Красота и здоровье',
  'Автотовары',
  'Спорт и туризм',
  'Строительство и ремонт',
  'Продукты питания',
  'Книги и хобби',
];

// Утилита форматирования телефона под KZ стандарта (+7 7XX XXX XX XX)
const formatKZPhone = (value) => {
  if (!value) return '+7 ';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);

  let formatted = '+7';
  if (digits.length > 1) formatted += ' (' + digits.substring(1, 4);
  if (digits.length >= 4) formatted += ') ' + digits.substring(4, 7);
  if (digits.length >= 7) formatted += '-' + digits.substring(7, 9);
  if (digits.length >= 9) formatted += '-' + digits.substring(9, 11);
  return formatted;
};

const isValidKZPhone = (phoneStr) => {
  const digits = phoneStr.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('7');
};

export default function RegisterScreen({ onRegistrationSuccess }) {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const tgUser = useMemo(() => {
    const rawUser = tg?.initDataUnsafe?.user;
    if (rawUser) {
      return {
        id: rawUser.id,
        username: rawUser.username || '',
        first_name: rawUser.first_name || '',
        last_name: rawUser.last_name || '',
        photo_url: rawUser.photo_url || '',
        isFallback: false,
      };
    }
    return {
      id: 999999999,
      username: 'kaspi_seller_demo',
      first_name: 'Асанәли',
      last_name: 'Құсайынов',
      photo_url: '',
      isFallback: true,
    };
  }, [tg]);

  const [formData, setFormData] = useState({
    shopName: '',
    city: '',
    niche: '',
    whatsapp: '+7 ',
    instagram: '',
    kaspiPhone: '+7 ',
    isClubMember: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#F2F2F7');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#F2F2F7');
    }
  }, [tg]);

  const triggerHaptic = (style = 'light') => {
    try { tg?.HapticFeedback?.impactOccurred(style); } catch {}
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePhoneChange = (field, e) => {
    const formatted = formatKZPhone(e.target.value);
    setFormData((prev) => ({ ...prev, [field]: formatted }));
    if (errorMsg) setErrorMsg('');
  };

  const handleInstagramChange = (e) => {
    const cleanValue = e.target.value.replace(/[@\s]/g, '').toLowerCase();
    setFormData((prev) => ({ ...prev, instagram: cleanValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    triggerHaptic('medium');

    if (!formData.shopName.trim()) {
      setErrorMsg('Укажите название вашего магазина на Kaspi');
      return;
    }
    if (!formData.city) {
      setErrorMsg('Выберите город торговли');
      return;
    }
    if (!formData.niche) {
      setErrorMsg('Выберите нишу ваших товаров');
      return;
    }
    if (!isValidKZPhone(formData.whatsapp)) {
      setErrorMsg('Введите корректный WhatsApp (+7 7XX XXX-XX-XX)');
      return;
    }
    if (!formData.instagram.trim()) {
      setErrorMsg('Укажите Instagram аккаунт бренда');
      return;
    }
    if (!isValidKZPhone(formData.kaspiPhone)) {
      setErrorMsg('Введите корректный номер Kaspi Pay / Gold');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        photo_url: tgUser.photo_url || null,
        shop_name: formData.shopName.trim(),
        city: formData.city,
        niche: formData.niche,
        whatsapp_phone: formData.whatsapp.replace(/\D/g, ''),
        instagram_handle: formData.instagram.trim(),
        kaspi_phone: formData.kaspiPhone.replace(/\D/g, ''),
        is_club_member: formData.isClubMember,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'telegram_id' })
        .select()
        .single();

      if (error) throw error;
      try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {}

      if (onRegistrationSuccess) {
        onRegistrationSuccess(data);
      }
    } catch (err) {
      console.error('Registration error:', err);
      try { tg?.HapticFeedback?.notificationOccurred('error'); } catch {}
      setErrorMsg(err.message || 'Ошибка сохранения. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-neutral-900 font-sans pb-12">
      {/* Шапка iOS */}
      <header className="sticky top-0 z-20 bg-[#F2F2F7]/85 backdrop-blur-md px-4 pt-4 pb-3 border-b border-black/[0.04]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF4820] flex items-center justify-center shadow-sm shadow-[#FF4820]/30 text-white font-bold text-sm tracking-wider">
              TAP
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none tracking-tight">Регистрация селлера</h1>
              <p className="text-[11px] text-neutral-500 mt-0.5">Traffic Automation Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white py-1 px-2.5 rounded-full border border-black/[0.05] shadow-xs">
            {tgUser.photo_url ? (
              <img src={tgUser.photo_url} alt="TG" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-700 flex items-center justify-center">
                {tgUser.first_name?.[0] || 'K'}
              </div>
            )}
            <span className="text-xs font-medium text-neutral-800 max-w-[80px] truncate">
              {tgUser.first_name || 'Селлер'}
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {tgUser.isFallback && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl text-[12px] text-amber-800 flex items-center space-x-2">
            <span>⚠️</span>
            <span>Запущено в браузере. Используются демо-данные Telegram.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* СЕКЦИЯ 1: Данные магазина */}
          <div>
            <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 px-3">
              Магазин на Kaspi.kz
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.05] shadow-xs divide-y divide-black/[0.05] overflow-hidden">
              <div className="p-3.5">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Название магазина
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  placeholder="Например, TechStore KZ"
                  className="w-full text-[15px] font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
                />
              </div>

              <div className="p-3.5 relative">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Город торговли
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full text-[15px] bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                    formData.city ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  <option value="" disabled>
                    Выберите город присутствия
                  </option>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="text-neutral-900">
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-[38px] pointer-events-none text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="p-3.5 relative">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Основная категория товаров
                </label>
                <select
                  value={formData.niche}
                  onChange={(e) => handleInputChange('niche', e.target.value)}
                  className={`w-full text-[15px] bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                    formData.niche ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  <option value="" disabled>
                    Выберите нишу магазина
                  </option>
                  {NICHES.map((n) => (
                    <option key={n} value={n} className="text-neutral-900">
                      {n}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-[38px] pointer-events-none text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ 2: Связь и счета */}
          <div>
            <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 px-3">
              Связь и выставление счетов
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.05] shadow-xs divide-y divide-black/[0.05] overflow-hidden">
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    WhatsApp для отчетов
                  </label>
                  <span className="text-[10px] text-emerald-600 font-medium">Основной канал</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.whatsapp}
                  onChange={(e) => handlePhoneChange('whatsapp', e)}
                  placeholder="+7 (701) 000-00-00"
                  className="w-full text-[15px] font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent tracking-wide"
                />
              </div>

              <div className="p-3.5">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Instagram аккаунт бренда
                </label>
                <div className="flex items-center">
                  <span className="text-[15px] text-neutral-400 font-medium mr-0.5 select-none">@</span>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={handleInstagramChange}
                    placeholder="myshop_kz"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full text-[15px] font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Номер Kaspi Pay / Kaspi Gold
                  </label>
                  <span className="text-[10px] text-neutral-400">Для счетов</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.kaspiPhone}
                  onChange={(e) => handlePhoneChange('kaspiPhone', e)}
                  placeholder="+7 (777) 000-00-00"
                  className="w-full text-[15px] font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent tracking-wide"
                />
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ 3: Клубная система */}
          <div>
            <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 px-3">
              Программа привилегий
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.05] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[15px] font-semibold text-neutral-900">Клубный статус TAP</span>
                    <span className="bg-[#FF4820]/10 text-[#FF4820] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      Х2 СКИДКА
                    </span>
                  </div>
                  <p className="text-[12px] text-neutral-500 mt-1 leading-snug">
                    Клубный взнос дает скидку х2 на запуски и льготную цену. Требует ежемесячного продления без пауз.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.isClubMember}
                    onChange={(e) => {
                      triggerHaptic('selection');
                      handleInputChange('isClubMember', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-[51px] h-[31px] bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:transition-all after:shadow-md peer-checked:bg-[#FF4820] transition-colors"></div>
                </label>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200/70 rounded-xl text-[13px] text-red-600 flex items-center space-x-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#FF4820] active:scale-[0.98] disabled:opacity-60 text-white rounded-2xl font-semibold text-[16px] tracking-tight shadow-md shadow-[#FF4820]/25 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? <span>Сохранение профиля...</span> : <span>Завершить регистрацию</span>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

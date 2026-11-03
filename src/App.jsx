import React, { useState } from 'react';
import RegisterScreen from './components/RegisterScreen';

export default function App() {
  // Сохраняем данные авторизованного селлера
  const [seller, setSeller] = useState(null);

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {!seller ? (
        // Если селлер еще не зарегистрирован — показываем форму регистрации
        <RegisterScreen onRegistrationSuccess={(userData) => setSeller(userData)} />
      ) : (
        // Когда зарегистрирован — перенаправляем в его личный кабинет (сюда добавим товары и спринты)
        <div className="p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-[#FF4820] text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4 shadow-md shadow-[#FF4820]/30">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Добро пожаловать, {seller.shop_name}!</h2>
          <p className="text-sm text-neutral-500 mt-1">Ваш профиль успешно защищен и зарегистрирован в TAP.</p>
          <div className="mt-6 p-4 bg-white rounded-2xl border border-black/[0.05] text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-400">Город:</span> <span className="font-medium">{seller.city}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Ниша:</span> <span className="font-medium">{seller.niche}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Клубный статус:</span> <span className="font-medium text-[#FF4820]">{seller.is_club_member ? 'Активен (Х2 скидка)' : 'Стандарт'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Coffee, TrendingUp, Users, DollarSign, Star, ShoppingCart, Award, Zap, Target, Crown } from 'lucide-react';

interface Competitor {
  id: number;
  name: string;
  price: number;
  quality: number;
  marketing: number;
  marketShare: number;
  isActive: boolean;
  money: number;
}

interface GameStats {
  round: number;
  money: number;
  customers: number;
  satisfaction: number;
  marketShare: number;
  monopolyStatus: boolean;
}

interface FloatingIcon {
  id: number;
  x: number;
  y: number;
  type: 'money' | 'customer' | 'star';
}

const CoffeeMarketGame = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    round: 1,
    money: 10000,
    customers: 0,
    satisfaction: 70,
    marketShare: 25,
    monopolyStatus: false
  });

  const [playerSettings, setPlayerSettings] = useState({
    price: 35000,
    quality: 50,
    marketing: 30
  });

  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: 1, name: 'Highlands Coffee', price: 40000, quality: 70, marketing: 60, marketShare: 30, isActive: true, money: 15000 },
    { id: 2, name: 'Phúc Long', price: 32000, quality: 60, marketing: 50, marketShare: 25, isActive: true, money: 12000 },
    { id: 3, name: 'The Coffee House', price: 38000, quality: 65, marketing: 55, marketShare: 20, isActive: true, money: 13000 }
  ]);

  const [message, setMessage] = useState('');
  const [showAcquisition, setShowAcquisition] = useState(false);
  const [, setSelectedCompetitor] = useState<number | null>(null);
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [shaking, setShaking] = useState(false);


  useEffect(() => {
    if (floatingIcons.length > 0) {
      const timer = setTimeout(() => {
        setFloatingIcons([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [floatingIcons]);

  const addFloatingIcons = (type: 'money' | 'customer' | 'star', count: number) => {
    const newIcons: FloatingIcon[] = [];
    for (let i = 0; i < count; i++) {
      newIcons.push({
        id: Date.now() + i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 20 + 40,
        type
      });
    }
    setFloatingIcons(prev => [...prev, ...newIcons]);
  };

  const calculateMarketShare = () => {
    const activeCompetitors = competitors.filter(c => c.isActive);

    const playerScore =
      (100 - playerSettings.price / 500) * 0.4 +
      playerSettings.quality * 0.35 +
      playerSettings.marketing * 0.25;

    const competitorScores = activeCompetitors.map(c => ({
      id: c.id,
      score: (100 - c.price / 500) * 0.4 + c.quality * 0.35 + c.marketing * 0.25
    }));

    const totalScore = playerScore + competitorScores.reduce((sum, c) => sum + c.score, 0);

    const newPlayerShare = (playerScore / totalScore) * 100;
    const newCompetitors = competitors.map(comp => {
      if (!comp.isActive) return comp;
      const compScore = competitorScores.find(c => c.id === comp.id);
      return {
        ...comp,
        marketShare: compScore ? (compScore.score / totalScore) * 100 : 0
      };
    });

    return { newPlayerShare, newCompetitors };
  };

  const playRound = () => {
    const { newPlayerShare, newCompetitors } = calculateMarketShare();

    const totalMarketCustomers = 1000;
    const playerCustomers = Math.floor((newPlayerShare / 100) * totalMarketCustomers);
    const revenue = playerCustomers * playerSettings.price;
    const costs = playerSettings.quality * 100 + playerSettings.marketing * 50 + 3000;
    const profit = revenue - costs;

    const priceImpact = Math.max(0, 100 - (playerSettings.price / 500));
    const qualityImpact = playerSettings.quality;
    let newSatisfaction = (priceImpact * 0.4 + qualityImpact * 0.6);

    const activeCount = competitors.filter(c => c.isActive).length;

    if (activeCount === 0) {
      newSatisfaction *= 0.6;
      setMessage('⚠️ Bạn đang độc quyền thị trường! Lợi nhuận cao nhưng khách hàng không hài lòng.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } else if (activeCount === 1) {
      newSatisfaction *= 0.8;
      setMessage('📊 Thị trường đang thiếu cạnh tranh. Khách hàng bắt đầu bất mãn.');
    } else if (playerSettings.price < 25000) {
      setMessage('💰 Chiến lược giá thấp thành công! Thị phần tăng mạnh.');
      addFloatingIcons('customer', 5);
    } else if (playerSettings.quality > 80) {
      setMessage('⭐ Chất lượng cao được đánh giá cao! Khách hàng trung thành.');
      addFloatingIcons('star', 5);
    } else {
      setMessage('📈 Cạnh tranh lành mạnh. Thị trường đang phát triển tốt.');
    }

    if (profit > 0) {
      addFloatingIcons('money', Math.min(8, Math.floor(profit / 2000)));
    }

    setStats({
      round: stats.round + 1,
      money: stats.money + profit,
      customers: playerCustomers,
      satisfaction: Math.round(newSatisfaction),
      marketShare: newPlayerShare,
      monopolyStatus: activeCount === 0
    });

    setCompetitors(newCompetitors);

    const adjustedCompetitors = newCompetitors.map(comp => {
      if (!comp.isActive) return comp;

      if (playerSettings.price < comp.price) {
        comp.price = Math.max(25000, comp.price - 2000);
      }
      if (playerSettings.quality > comp.quality) {
        comp.quality = Math.min(100, comp.quality + 5);
      }

      return comp;
    });

    setCompetitors(adjustedCompetitors);
  };

  const acquireCompetitor = (competitorId: number) => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) return;

    const acquisitionCost = competitor.money * 2 + competitor.marketShare * 500;

    if (stats.money < acquisitionCost) {
      alert('❌ Không đủ tiền để mua lại đối thủ này!');
      return;
    }

    const newCompetitors = competitors.map(c =>
      c.id === competitorId ? { ...c, isActive: false } : c
    );

    setCompetitors(newCompetitors);
    setStats({
      ...stats,
      money: stats.money - acquisitionCost,
      marketShare: stats.marketShare + competitor.marketShare
    });

    setShowAcquisition(false);
    setSelectedCompetitor(null);

    const remainingActive = newCompetitors.filter(c => c.isActive).length;
    if (remainingActive === 0) {
      setMessage('🏆 Bạn đã độc quyền thị trường! Lợi nhuận tối đa nhưng hãy coi chừng phản ứng của khách hàng.');
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    } else {
      setMessage(`✅ Đã mua lại ${competitor.name}! Thị phần của bạn tăng lên.`);
    }
  };

  const getMarketType = () => {
    const activeCount = competitors.filter(c => c.isActive).length;
    if (activeCount === 0) return { type: 'Độc quyền', color: 'text-red-600', icon: '👑', bgColor: 'from-red-50 to-red-100' };
    if (activeCount === 1) return { type: 'Độc quyền nhóm', color: 'text-orange-600', icon: '⚠️', bgColor: 'from-orange-50 to-orange-100' };
    if (activeCount === 2) return { type: 'Cạnh tranh không hoàn hảo', color: 'text-yellow-600', icon: '📊', bgColor: 'from-yellow-50 to-yellow-100' };
    return { type: 'Cạnh tranh hoàn hảo', color: 'text-green-600', icon: '✅', bgColor: 'from-green-50 to-green-100' };
  };

  const marketType = getMarketType();

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`
              }}
            >
              ☕
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 relative z-10 animate-slideUp">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Coffee className="w-20 h-20 mx-auto text-amber-700 mb-4 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-fadeIn">Thị Trường Cà Phê</h1>
            <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>Mô phỏng cạnh tranh & độc quyền</p>
          </div>

          <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-amber-200 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-600" />
              📖 Cách chơi:
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start hover:translate-x-2 transition-transform">
                <span className="mr-2">🎯</span>
                <span>Điều chỉnh giá bán, chất lượng và quảng cáo để thu hút khách hàng</span>
              </li>
              <li className="flex items-start hover:translate-x-2 transition-transform">
                <span className="mr-2">💰</span>
                <span>Giá thấp = nhiều khách, nhưng lợi nhuận ít</span>
              </li>
              <li className="flex items-start hover:translate-x-2 transition-transform">
                <span className="mr-2">⭐</span>
                <span>Chất lượng cao = khách hàng trung thành</span>
              </li>
              <li className="flex items-start hover:translate-x-2 transition-transform">
                <span className="mr-2">🏢</span>
                <span>Mua lại đối thủ để tăng thị phần và tiến tới độc quyền</span>
              </li>
              <li className="flex items-start hover:translate-x-2 transition-transform">
                <span className="mr-2">⚠️</span>
                <span>Độc quyền = lợi nhuận cao nhưng khách hàng không hài lòng!</span>
              </li>
            </ul>
          </div>

          <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border-2 border-blue-200 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              🧠 Học kinh tế:
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                <strong className="text-green-700">✅ Cạnh tranh hoàn hảo:</strong> Nhiều doanh nghiệp, giá cả cạnh tranh, người tiêu dùng có lợi
              </div>
              <div className="p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                <strong className="text-red-700">👑 Độc quyền:</strong> Một doanh nghiệp kiểm soát thị trường, giá cao, ít lựa chọn
              </div>
            </div>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full bg-linear-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl transform hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.8s' }}
          >
            🎮 Bắt đầu chơi
          </button>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-float { animation: float infinite ease-in-out; }
          .animate-slideUp { animation: slideUp 0.6s ease-out; }
          .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-5 text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            ☕
          </div>
        ))}
      </div>

      {floatingIcons.map(icon => (
        <div
          key={icon.id}
          className="absolute text-3xl animate-floatUp pointer-events-none z-50"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
          }}
        >
          {icon.type === 'money' && '💰'}
          {icon.type === 'customer' && '👥'}
          {icon.type === 'star' && '⭐'}
        </div>
      ))}

      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                fontSize: '24px'
              }}
            >
              {['🎉', '🎊', '👑', '⭐', '💰'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className={`bg-white rounded-2xl shadow-2xl p-6 mb-4 transition-all ${shaking ? 'animate-shake' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Coffee className="w-10 h-10 text-amber-700 animate-pulse" />
                {stats.monopolyStatus && (
                  <Crown className="w-5 h-5 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Quán Cà Phê Của Bạn</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-semibold ${marketType.color} px-3 py-1 rounded-full bg-linear-to-br ${marketType.bgColor} animate-pulse`}>
                    {marketType.icon} {marketType.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Vòng {stats.round}</div>
              <div className="text-2xl font-bold text-green-600 animate-pulse">
                {stats.money.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {message && (
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 mb-6 rounded animate-slideIn shadow-md">
              <p className="text-blue-800 font-medium">{message}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 transform">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600 animate-bounce" />
                <span className="text-sm text-gray-600">Khách hàng</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{stats.customers}</div>
              <div className="text-xs text-blue-600 mt-1">👥 +{Math.floor(stats.customers * 0.1)}</div>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 transform">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600 animate-bounce" />
                <span className="text-sm text-gray-600">Thị phần</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.marketShare.toFixed(1)}%</div>
              <div className="h-1 bg-green-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-500 rounded-full"
                  style={{ width: `${stats.marketShare}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-linear-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 transform">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600 animate-bounce" />
                <span className="text-sm text-gray-600">Hài lòng</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{stats.satisfaction}%</div>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.floor(stats.satisfaction / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 transform">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600 animate-bounce" />
                <span className="text-sm text-gray-600">Vị trí</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                #{competitors.filter(c => c.isActive && c.marketShare > stats.marketShare).length + 1}
              </div>
              {competitors.filter(c => c.isActive && c.marketShare > stats.marketShare).length === 0 && (
                <div className="text-xs text-purple-600 mt-1">🏆 Số 1</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Giá bán (VNĐ)
              </label>
              <input
                type="range"
                min="20000"
                max="60000"
                step="1000"
                value={playerSettings.price}
                onChange={(e) => setPlayerSettings({ ...playerSettings, price: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
              <div className="text-center font-bold text-lg text-amber-700 mt-1 bg-amber-50 rounded-lg py-2">
                {playerSettings.price.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⭐ Chất lượng
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={playerSettings.quality}
                onChange={(e) => setPlayerSettings({ ...playerSettings, quality: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
              <div className="text-center font-bold text-lg text-amber-700 mt-1 bg-amber-50 rounded-lg py-2">
                {playerSettings.quality}%
              </div>
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📢 Marketing
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={playerSettings.marketing}
                onChange={(e) => setPlayerSettings({ ...playerSettings, marketing: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
              <div className="text-center font-bold text-lg text-amber-700 mt-1 bg-amber-50 rounded-lg py-2">
                {playerSettings.marketing}%
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={playRound}
              className="flex-1 bg-linear-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ▶️ Chạy vòng tiếp theo
            </button>
            <button
              onClick={() => setShowAcquisition(!showAcquisition)}
              disabled={competitors.filter(c => c.isActive).length === 0}
              className="bg-linear-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
            >
              🏢 Mua lại đối thủ
            </button>
          </div>
        </div>

        {showAcquisition && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4 animate-slideIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
              🏢 Mua lại đối thủ
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {competitors.filter(c => c.isActive).map(comp => {
                const cost = comp.money * 2 + comp.marketShare * 500;
                return (
                  <div key={comp.id} className="bg-linear-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      {comp.name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span>Thị phần:</span>
                        <span className="font-bold">{comp.marketShare.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giá:</span>
                        <span className="font-bold">{comp.price.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chất lượng:</span>
                        <span className="font-bold">{comp.quality}%</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-purple-700 mb-3 bg-white p-2 rounded-lg text-center">
                      💰 {cost.toLocaleString('vi-VN')} đ
                    </div>
                    <button
                      onClick={() => acquireCompetitor(comp.id)}
                      disabled={stats.money < cost}
                      className="w-full bg-linear-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm transform hover:scale-105 disabled:scale-100 shadow-md"
                    >
                      {stats.money < cost ? '❌ Không đủ tiền' : '✅ Mua lại'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            🏪 Đối thủ cạnh tranh
          </h2>
          <div className="space-y-3">
            {competitors.map((comp, index) => (
              <div
                key={comp.id}
                className={`p-4 rounded-xl border-2 transition-all transform hover:scale-102 ${comp.isActive
                  ? 'bg-linear-to-br from-white to-blue-50 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg'
                  : 'bg-linear-to-br from-gray-100 to-gray-200 border-gray-300 opacity-60'
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Coffee className={`w-5 h-5 ${comp.isActive ? 'text-amber-600 animate-pulse' : 'text-gray-400'}`} />
                      <span className="font-bold text-gray-800">{comp.name}</span>
                      {!comp.isActive && (
                        <span className="text-xs bg-linear-to-br from-red-100 to-pink-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
                          ✓ Đã mua lại
                        </span>
                      )}
                      {comp.isActive && comp.marketShare > stats.marketShare && (
                        <span className="text-xs bg-linear-to-br from-yellow-100 to-amber-100 text-yellow-700 px-2 py-1 rounded-full">
                          👑 Dẫn đầu
                        </span>
                      )}
                    </div>
                    {comp.isActive && (
                      <div className="grid grid-cols-4 gap-2 text-sm text-gray-600">
                        <div className="bg-white p-2 rounded-lg">
                          <div className="font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Giá
                          </div>
                          <div className="text-xs font-bold text-green-600">{comp.price.toLocaleString('vi-VN')} đ</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <div className="font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Chất lượng
                          </div>
                          <div className="text-xs font-bold text-yellow-600">{comp.quality}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <div className="font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Marketing
                          </div>
                          <div className="text-xs font-bold text-purple-600">{comp.marketing}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <div className="font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Thị phần
                          </div>
                          <div className="text-xs font-bold text-blue-600">{comp.marketShare.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {comp.isActive && (
                  <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-3 rounded-full transition-all duration-1000 bg-linear-to-r from-blue-500 to-cyan-500 relative overflow-hidden"
                      style={{ width: `${comp.marketShare}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-30 animate-shimmer"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              📊 Phân tích thị trường
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 mb-1">Mức độ cạnh tranh:</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${competitors.filter(c => c.isActive).length === 0 ? 'bg-red-500' :
                        competitors.filter(c => c.isActive).length === 1 ? 'bg-orange-500' :
                          competitors.filter(c => c.isActive).length === 2 ? 'bg-yellow-500' :
                            'bg-green-500'
                        }`}
                      style={{ width: `${(competitors.filter(c => c.isActive).length / 3) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-800">
                    {competitors.filter(c => c.isActive).length}/3
                  </span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 mb-1">Sức khỏe thị trường:</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${stats.satisfaction < 50 ? 'bg-red-500' :
                        stats.satisfaction < 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${stats.satisfaction}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-800">
                    {stats.satisfaction < 50 ? '😞' : stats.satisfaction < 70 ? '😐' : '😊'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }
        @keyframes confetti {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float infinite ease-in-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-floatUp { animation: floatUp 2s ease-out forwards; }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .hover:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
};

export default CoffeeMarketGame;
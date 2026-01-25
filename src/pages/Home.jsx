import React, { useState, useEffect } from 'react';
import { Loader2, Search, Wallet } from 'lucide-react';
import EventCard from '../components/EventCard';
import { getEventDescription } from '../utils/eventStorage';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

const Home = ({ account, isConnected, chain, onBuyTicket, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!isConnected) {
        setLoading(false);
        setEvents([]);
        return;
      }

      try {
        setLoading(true);
        const eventList = [];
        const localData = JSON.parse(localStorage.getItem('event_data') || '{}');

        console.log('========== 开始加载活动 ==========');

        // 使用ethers直接读取，更快
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        // 只查询前10个活动
        for (let i = 0; i < 10; i++) {
          try {
            const info = await contract.getEventInfo(i);
            
            if (info && info.name && info.isActive) {
              console.log(`✅ 活动 ${i}: ${info.name}, isActive: ${info.isActive}`);
              
              // 格式化价格
              const priceWei = info.ticketPrice;
              const priceEth = (Number(priceWei) / 1e18).toFixed(4);

              // 格式化时间
              const eventDate = new Date(Number(info.eventTime) * 1000).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });

              const eventData = {
                id: i,
                name: info.name,
                venue: info.venue,
                description: getEventDescription(i),
                date: eventDate,
                price: priceEth,
                priceRaw: info.ticketPrice,
                totalTickets: Number(info.maxTickets),
                soldTickets: Number(info.soldTickets),
                isActive: info.isActive,
                imageUrl: localData[i]?.imageUrl || '',
              };

              eventList.push(eventData);
            } else {
              console.log(`⚠️ 活动 ${i} 不存在或未激活`);
            }
          } catch (error) {
            console.log(`❌ 活动 ${i} 读取失败:`, error.message);
          }
        }

        console.log(`========== 加载完成，共 ${eventList.length} 个活动 ==========`);
        setEvents(eventList);
      } catch (error) {
        console.error('加载活动失败:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [isConnected, refreshTrigger]);

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 未连接钱包，显示引导界面
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🎪 热门活动
          </h1>
          <p className="text-slate-500">发现并购买你喜欢的活动门票</p>
        </div>

        {/* Wallet Connect Guide */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">连接钱包以继续</h3>
          <p className="text-slate-500 text-center max-w-md mb-8">
            请点击右上角的"连接钱包"按钮，支持 MetaMask、WalletConnect、Coinbase Wallet 等多种钱包。
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md">
            <h4 className="font-bold text-lg text-slate-900 mb-4">使用说明：</h4>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">1</span>
                </div>
                <p>点击右上角"连接钱包"按钮</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">2</span>
                </div>
                <p>选择你喜欢的钱包（MetaMask、WalletConnect等）</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">3</span>
                </div>
                <p>授权连接并切换到 Sepolia 测试网络</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          🎪 热门活动
        </h1>
        <p className="text-slate-500">发现并购买你喜欢的活动门票</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索活动名称或场地..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500">加载活动中...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Search className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">暂无可用活动</h3>
          <p className="text-slate-500 text-center max-w-sm">
            {searchTerm ? '没有找到匹配的活动' : '目前还没有发布任何活动，敬请期待！'}
          </p>
        </div>
      ) : (
        <>
          {/* Event Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={onBuyTicket}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;

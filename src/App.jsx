import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Verify from './pages/Verify';
import Admin from './pages/Admin';
import BuyTicketModal from './components/BuyTicketModal';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_OWNER } from './config';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [ticketRefreshTrigger, setTicketRefreshTrigger] = useState(0);
  const [eventRefreshTrigger, setEventRefreshTrigger] = useState(0);
  const [contract, setContract] = useState(null);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // 初始化合约实例（用于 BuyTicketModal 和购票）
  useEffect(() => {
    const initContract = async () => {
      if (typeof window.ethereum !== 'undefined' && isConnected) {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setContract(contractInstance);
          console.log('✅ 合约实例已初始化（with signer）');
        } catch (error) {
          console.error('❌ 合约初始化失败:', error);
        }
      }
    };

    initContract();
  }, [isConnected]);

  // 检查是否是owner
  const isOwner = isConnected && address && address.toLowerCase() === CONTRACT_OWNER.toLowerCase();

  console.log('isOwner:', isOwner, 'address:', address, 'CONTRACT_OWNER:', CONTRACT_OWNER);

  // 切换到 Sepolia 网络
  const switchToSepolia = () => {
    switchChain({ chainId: 11155111 });
  };

  // 刷新门票列表
  const refreshTickets = () => {
    setTicketRefreshTrigger(prev => prev + 1);
  };

  // 刷新活动列表
  const refreshEvents = () => {
    setEventRefreshTrigger(prev => prev + 1);
  };

  // 购票处理（从 EventCard 点击）
  const handleBuyTicket = (event) => {
    console.log('选择活动:', event);
    setSelectedEvent(event);
    setSelectedSeat(null);
  };

  // 购票提交（使用 ethers.js）
  const buyTicket = async (event, seatData) => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    if (!contract) {
      alert('合约未初始化，请稍候...');
      return;
    }

    // 保存座位信息到 state
    setSelectedSeat(seatData);

    try {
      // 使用原始价格（wei 值）或转换格式化后的价格
      const priceWei = event.priceRaw
        ? event.priceRaw
        : BigInt(Math.floor(parseFloat(event.price) * 1e18));

      console.log('========== 开始购票 ==========');
      console.log('活动信息:', event);
      console.log('活动 ID:', event.id);
      console.log('活动名称:', event.name);
      console.log('座位信息:', seatData);
      console.log('价格 (wei):', priceWei.toString());
      console.log('当前网络:', chain?.id, chain?.name);
      console.log('钱包地址:', address);
      console.log('合约地址:', CONTRACT_ADDRESS);

      // 检查网络
      if (chain?.id !== 11155111) {
        alert('请切换到 Sepolia 测试网络');
        return;
      }

      console.log('📤 准备调用合约 buyTicket 方法...');

      // 使用 ethers.js 直接调用合约
      const tx = await contract.buyTicket(
        event.id,
        seatData.section,
        BigInt(seatData.row),
        BigInt(seatData.seat),
        'ipfs://QmExample' + Date.now(),
        { value: priceWei }
      );

      console.log('✅ 交易已提交到区块链');
      console.log('交易哈希:', tx.hash);
      console.log('等待交易确认...');

      // 等待交易确认
      const receipt = await tx.wait();
      console.log('✅ 交易已确认！');
      console.log('Gas used:', receipt.gasUsed.toString());

      // 计算并保存 token ID 到 localStorage
      const tokenKey = `tickets_${address.toLowerCase()}`;
      const savedTickets = JSON.parse(localStorage.getItem(tokenKey) || '[]');

      // 计算 token ID: event.id * 10000 + row * 100 + seat
      const { section, row, seat } = seatData;
      const tokenId = event.id * 10000 + row * 100 + seat;

      console.log('💾 保存 ticket ID:', tokenId);
      console.log('活动ID:', event.id, '行:', row, '座:', seat);
      console.log('之前的 tickets:', savedTickets);

      savedTickets.push(tokenId);
      localStorage.setItem(tokenKey, JSON.stringify(savedTickets));

      console.log('✅ 保存成功！当前 tickets:', JSON.parse(localStorage.getItem(tokenKey)));

      alert('🎉 购票成功！');
      setSelectedEvent(null);
      setSelectedSeat(null);
      refreshTickets();
      setCurrentPage('my-tickets');

    } catch (error) {
      console.error('❌ 购票失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        data: error.data
      });

      // 特殊错误处理
      if (error.code === 'ACTION_REJECTED') {
        alert('用户取消了交易');
      } else if (error.message.includes('insufficient funds')) {
        alert('钱包余额不足');
      } else if (error.message.includes('Seat already taken')) {
        alert('该座位已被购买，请选择其他座位');
      } else {
        alert('购票失败: ' + (error.message || '未知错误'));
      }

      setSelectedSeat(null);
    }
  };

  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home account={address} isConnected={isConnected} chain={chain} onBuyTicket={handleBuyTicket} refreshTrigger={eventRefreshTrigger} />;
      case 'my-tickets':
        return <MyTickets account={address} isConnected={isConnected} refreshTrigger={ticketRefreshTrigger} />;
      case 'verify':
        if (!isOwner) {
          return (
            <div className="flex flex-col items-center justify-center py-32 px-4">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">🔒 访问受限</h2>
              <p className="text-slate-600 text-center max-w-md">
                门票核销仅对合约管理员开放。<br/>
                当前钱包地址不是管理员。
              </p>
            </div>
          );
        }
        return <Verify account={address} isConnected={isConnected} />;
      case 'admin':
        if (!isOwner) {
          return (
            <div className="flex flex-col items-center justify-center py-32 px-4">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">🔒 访问受限</h2>
              <p className="text-slate-600 text-center max-w-md">
                管理后台仅对合约管理员开放。<br/>
                当前钱包地址不是管理员。
              </p>
            </div>
          );
        }
        return <Admin account={address} isConnected={isConnected} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        account={address}
        isConnected={isConnected}
        isOwner={isOwner}
        onSwitchChain={switchToSepolia}
        currentChain={chain}
      />
      {renderPage()}
      {selectedEvent && (
        <BuyTicketModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onConfirm={(seatData) => buyTicket(selectedEvent, seatData)}
          contract={contract}
        />
      )}
    </>
  );
}

export default App;

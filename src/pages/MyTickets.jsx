import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Ticket, Wallet } from 'lucide-react';
import TicketCard from '../components/TicketCard';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

const MyTickets = ({ account, isConnected, refreshTrigger }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);

  useEffect(() => {
    const loadBalance = async () => {
      if (!isConnected || !account) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        console.log('========== 开始读取余额 ==========');
        console.log('账户:', account);

        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const balance = await contract.balanceOf(account);
        console.log('✅ 余额:', balance.toString());

        const balanceNum = Number(balance);
        setTotalTickets(balanceNum);

        if (balanceNum > 0) {
          await loadTickets(balanceNum, account);
        } else {
          setTickets([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ 读取余额失败:', error);
        setTickets([]);
        setLoading(false);
      }
    };

    loadBalance();
  }, [account, isConnected, refreshTrigger]);

  const loadTickets = async (balanceNum, account) => {
    if (!account || balanceNum === 0) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const ticketList = [];

      console.log('========== 从 localStorage 读取门票 ==========');
      console.log('账户:', account);

      // 方法1：从 localStorage 读取购买的 ticket ID（最快）
      const savedTickets = JSON.parse(localStorage.getItem(`tickets_${account.toLowerCase()}`) || '[]');
      console.log('localStorage 中的 tickets:', savedTickets);

      let allTicketIds = savedTickets;

      // 如果 localStorage 中的门票数量不足，从合约补充查询（确保旧票能找到）
      if (savedTickets.length < balanceNum) {
        console.log(`⚠️ localStorage 有 ${savedTickets.length} 张，实际余额有 ${balanceNum} 张，需要补充查询`);

        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        // 使用 ownerOf 迭代查询（tokenOfOwnerByIndex 不可用）
        // 优化：只查询前 10 个活动的 token ID 范围（每个活动最多 10000 个 ID）
        const MAX_TOKENS_TO_CHECK = 100000; // 10 个活动 × 10000
        const contractTicketIds = [];

        console.log(`🔍 开始查询 token ID，范围: 0 - ${MAX_TOKENS_TO_CHECK}`);

        // 分批查询，避免一次性请求太多
        const BATCH_SIZE = 100;
        for (let batchStart = 0; batchStart < MAX_TOKENS_TO_CHECK && contractTicketIds.length < balanceNum; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, MAX_TOKENS_TO_CHECK);

          const batchPromises = [];
          for (let tokenId = batchStart; tokenId < batchEnd; tokenId++) {
            batchPromises.push(
              contract.ownerOf(tokenId)
                .then(owner => {
                  if (owner.toLowerCase() === account.toLowerCase()) {
                    console.log(`✅ 找到 token: ${tokenId}`);
                    return Number(tokenId);
                  }
                  return null;
                })
                .catch(() => null) // token 不存在，忽略
            );
          }

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(tokenId => {
            if (tokenId !== null) {
              contractTicketIds.push(tokenId);
            }
          });

          // 如果找到足够的票，提前退出
          if (contractTicketIds.length >= balanceNum) {
            break;
          }

          // 显示进度
          if (batchEnd % 1000 === 0) {
            console.log(`🔄 已检查 ${batchEnd} 个 token，找到 ${contractTicketIds.length} 张票...`);
          }
        }

        console.log('✅ 从合约查询到的 ticket IDs:', contractTicketIds);

        // 去重：避免重复
        const uniqueTicketIds = [...new Set([...savedTickets, ...contractTicketIds])];
        allTicketIds = uniqueTicketIds;

        // 更新 localStorage，下次就不用再查询了
        localStorage.setItem(`tickets_${account.toLowerCase()}`, JSON.stringify(uniqueTicketIds));
        console.log('✅ 已更新 localStorage，共保存', uniqueTicketIds.length, '张票');
      } else {
        console.log('✅ 从 localStorage 加载，直接获取详细信息');
      }

      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // 获取每个 token 的详细信息
      const infoPromises = allTicketIds.map(async (tokenId) => {
        try {
          const info = await contract.getTicketInfo(tokenId);
          console.log(`✅ Token ${tokenId}: ${info.eventName}`);

          return {
            tokenId: Number(tokenId),
            eventId: Number(info.eventId),
            eventName: info.eventName,
            section: info.section,
            row: Number(info.row),
            seat: Number(info.seat),
            isVerified: info.isVerified,
          };
        } catch (error) {
          console.error(`❌ Token ${tokenId} 失败:`, error.message);
          return null;
        }
      });

      const ticketResults = await Promise.all(infoPromises);
      ticketResults.forEach(ticket => {
        if (ticket) {
          ticketList.push(ticket);
        }
      });

      console.log(`✅ 加载完成，共 ${ticketList.length} 张门票`);
      setTickets(ticketList);
    } catch (error) {
      console.error('========== 加载门票失败 ==========');
      console.error('错误:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🎟️ 我的门票
          </h1>
          <p className="text-slate-500">共 {tickets.length} 张门票</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">连接钱包以查看门票</h3>
          <p className="text-slate-500 text-center max-w-md mb-8">
            请点击右上角的"连接钱包"按钮，使用 MetaMask 钱包连接到 Sepolia 测试网络。
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md">
            <h4 className="font-bold text-lg text-slate-900 mb-4">使用说明：</h4>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">1</span>
                </div>
                <p>确保已安装 MetaMask 浏览器扩展</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">2</span>
                </div>
                <p>点击右上角"连接钱包"按钮</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">3</span>
                </div>
                <p>在 MetaMask 中授权连接</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-indigo-600">4</span>
                </div>
                <p>切换到 Sepolia 测试网络</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              🎟️ 我的门票
            </h1>
            <p className="text-slate-500">共 {tickets.length} 张门票</p>
          </div>
          <button
            onClick={() => loadTickets(totalTickets, account)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-600">刷新</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500">加载门票中...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Ticket className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">还没有购买门票</h3>
          <p className="text-slate-500 text-center max-w-sm">
            去票务中心选择你感兴趣的活动吧！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.tokenId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;

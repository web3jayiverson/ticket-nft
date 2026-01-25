import React, { useState, useRef } from 'react';
import { Search, CheckCircle, XCircle, Shield, Loader2, Wallet, Camera, Copy, Check } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

// 随机票号配置（与 TicketCard 一致）
const BASE = 10000000; // 基数
const SUFFIX_RANGE = 10000; // 后缀随机范围

// 解析票号（支持简单ID和随机票号）
const parseTicketCode = (input) => {
  // 移除所有非数字
  const numbers = input.replace(/\D/g, '');

  if (!numbers) return null;

  const codeNum = parseInt(numbers, 10);

  // 如果票号很小（<100），可能是直接输入的原始 Token ID
  if (codeNum < 100) {
    return codeNum;
  }

  // 否则是随机票号，需要解析
  // 反向计算：除以基数
  const tokenId = Math.floor(codeNum / BASE);
  return tokenId;
};

const Verify = ({ account, isConnected, isOwner }) => {
  const [tokenId, setTokenId] = useState('');
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // 获取合约实例
  const getContract = async () => {
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, await provider.getSigner());
  };

  const checkTicket = async () => {
    if (!tokenId) {
      alert('请输入票号');
      return;
    }

    try {
      setLoading(true);

      // 解析票号（支持原始ID和随机票号）
      const tokenIdNumber = parseTicketCode(tokenId);

      if (!tokenIdNumber || tokenIdNumber <= 0) {
        throw new Error('票号必须是正整数');
      }

      console.log('========== 开始查询门票 ==========');
      console.log('用户输入:', tokenId);
      console.log('解析后的 Token ID:', tokenIdNumber);
      console.log('合约地址:', CONTRACT_ADDRESS);

      // 获取合约实例（只读）
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // 先尝试获取门票信息
      const info = await contract.getTicketInfo(tokenIdNumber);
      console.log('门票信息成功获取:', info);
      console.log('- eventId:', info.eventId?.toString());
      console.log('- eventName:', info.eventName);
      console.log('- owner:', info.owner);
      console.log('- isVerified:', info.isVerified);

      // 检查门票是否有效
      const isValid = await contract.isTicketValid(tokenIdNumber);
      console.log('门票是否有效:', isValid);

      setTicketInfo({
        valid: isValid,
        eventName: info.eventName,
        section: info.section,
        row: Number(info.row),
        seat: Number(info.seat),
        isVerified: info.isVerified,
        owner: info.owner,
        eventId: Number(info.eventId),
      });
    } catch (error) {
      console.error('========== 查询失败 ==========');
      console.error('错误信息:', error.message);
      console.error('错误代码:', error.code);
      console.error('完整错误:', error);
      setTicketInfo({ valid: false, error: error.message || '门票不存在' });
    } finally {
      setLoading(false);
    }
  };

  // 从剪贴板粘贴
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // 提取所有数字
      const numbers = text.replace(/\D/g, '');
      if (numbers && numbers.length > 0) {
        // 直接使用数字（去除前导零）
        const cleanNumber = parseInt(numbers, 10).toString();
        setTokenId(cleanNumber);
      } else {
        alert('剪贴板中没有找到票号');
      }
    } catch (error) {
      alert('无法访问剪贴板，请手动输入票号');
    }
  };

  // 复制当前输入
  const copyToClipboard = async () => {
    if (!tokenId) return;
    try {
      await navigator.clipboard.writeText(tokenId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('复制失败');
    }
  };

  // 上传二维码图片识别
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 注意：这里需要集成二维码识别库，如 jsQR
    // 暂时提示用户手动输入
    alert('二维码识别功能需要额外库支持，请手动输入票号');
  };

  const verifyTicket = async () => {
    if (!tokenId) {
      alert('请输入票号');
      return;
    }

    try {
      setVerifying(true);

      // 解析票号（支持原始ID和随机票号）
      const tokenIdNumber = parseTicketCode(tokenId);

      if (!tokenIdNumber || tokenIdNumber <= 0) {
        throw new Error('票号必须是正整数');
      }

      console.log('核销 Token ID:', tokenIdNumber);
      console.log('核销票号:', tokenId);

      // 获取带signer的合约实例（用于写入）
      const contract = await getContract();
      const tx = await contract.verifyTicket(tokenIdNumber);
      await tx.wait();

      alert('✅ 门票核销成功！');
      setTokenId('');
      setTicketInfo(null);
    } catch (error) {
      console.error('核销失败:', error);
      alert('核销失败: ' + (error.message || '操作失败'));
    } finally {
      setVerifying(false);
    }
  };

  // 未连接钱包，显示引导界面
  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            门票核销
          </h1>
          <p className="text-slate-500">扫描或输入票号进行核销</p>
        </div>

        {/* Wallet Connect Guide */}
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">连接钱包以核销门票</h3>
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          门票核销
        </h1>
        <p className="text-sm sm:text-base text-slate-500">扫描或输入票号进行核销</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            票号
          </label>
          <div className="space-y-3">
            {/* 主输入框 */}
            <div className="flex space-x-2 sm:space-x-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="请输入票号"
                value={tokenId}
                onChange={(e) => {
                  // 只允许数字，过滤其他字符
                  const value = e.target.value.replace(/\D/g, '');
                  setTokenId(value);
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-base sm:text-lg text-center font-mono font-bold"
              />
              <button
                onClick={checkTicket}
                disabled={loading}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>

            {/* 快捷操作按钮 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={pasteFromClipboard}
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs sm:text-sm font-medium"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>粘贴</span>
              </button>

              <button
                onClick={copyToClipboard}
                disabled={!tokenId}
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>复制</span>
                  </>
                )}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors text-xs sm:text-sm font-medium"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>扫码</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <p className="text-[10px] sm:text-xs text-slate-500 text-center">
              💡 提示：可以从门票上复制票号，或使用手机拍照上传二维码
            </p>
          </div>
        </div>

        {/* Result */}
        {ticketInfo && (
          <div
            className={`p-4 sm:p-6 rounded-2xl border-2 ${
              ticketInfo.eventName ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            {ticketInfo.eventName ? (
              <>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-green-900">门票有效</h3>
                    <p className="text-xs sm:text-sm text-green-700">
                      {ticketInfo.isVerified ? '门票已核销' : '可以核销'}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-slate-500 mb-0.5 sm:mb-1">活动</p>
                      <p className="font-semibold text-slate-900 truncate">{ticketInfo.eventName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5 sm:mb-1">座位</p>
                      <p className="font-semibold text-slate-900">
                        {ticketInfo.section} - {ticketInfo.row}排{ticketInfo.seat}座
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5 sm:mb-1">持票人</p>
                      <p className="font-semibold text-slate-900 font-mono text-[10px] sm:text-xs truncate">
                        {ticketInfo.owner ? `${ticketInfo.owner.slice(0, 6)}...${ticketInfo.owner.slice(-4)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5 sm:mb-1">状态</p>
                      <p className={`font-semibold ${ticketInfo.isVerified ? 'text-red-600' : 'text-green-600'}`}>
                        {ticketInfo.isVerified ? '已使用' : '未使用'}
                      </p>
                    </div>
                  </div>
                </div>

                {!ticketInfo.isVerified && (
                  <button
                    onClick={verifyTicket}
                    disabled={verifying}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2 inline" />
                        核销中...
                      </>
                    ) : (
                      '确认核销'
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-red-900">门票无效</h3>
                    <p className="text-xs sm:text-sm text-red-700">
                      {ticketInfo.error || '门票不存在或已核销'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">📋 核销说明</h3>
        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[10px] sm:text-sm text-indigo-600">1</span>
            </div>
            <p>输入或扫描门票上的票号</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[10px] sm:text-sm text-indigo-600">2</span>
            </div>
            <p>系统自动验证门票有效性</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[10px] sm:text-sm text-indigo-600">3</span>
            </div>
            <p>确认信息后点击"确认核销"</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[10px] sm:text-sm text-indigo-600">4</span>
            </div>
            <p>核销成功后门票状态更新为"已使用"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, DollarSign, Users, Loader2, Check, X, Edit, Image as ImageIcon, Upload, Trash2, ArrowLeft } from 'lucide-react';
import { ethers } from 'ethers';
import { saveEventData, getEventData, getEventImage, loadAllEventData } from '../utils/eventStorage';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

const Admin = ({ account, isConnected, isOwner, onSuccess }) => {
  const [mode, setMode] = useState('list'); // 'create' | 'list' | 'edit'
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    description: '',
    imageUrl: '',
    eventTime: '',
    ticketPrice: '',
    maxTickets: '',
    allowResale: false,
    maxResalePrice: '',
    resaleDeadline: '',
  });

  const [editingEventId, setEditingEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // 获取合约实例
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, await provider.getSigner());
  };

  // 加载活动列表
  useEffect(() => {
    if (mode === 'list' && isConnected) {
      loadEvents();
    }
  }, [mode, isConnected]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventList = [];
      const localData = loadAllEventData();

      console.log('========== Admin: 开始加载活动列表 ==========');
      console.log('本地数据:', localData);
      console.log('合约地址:', CONTRACT_ADDRESS);

      // 检查网络连接
      if (!window.ethereum) {
        console.error('❌ 未检测到 MetaMask');
        alert('请安装 MetaMask 钱包');
        setEvents([]);
        return;
      }

      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('当前网络:', network.chainId.toString());

      if (Number(network.chainId) !== 11155111) {
        console.error('❌ 不是 Sepolia 网络');
        alert('请切换到 Sepolia 测试网络');
        setEvents([]);
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // 先测试合约是否可访问
      try {
        const owner = await contract.owner();
        console.log('✅ 合约可访问，Owner:', owner);
      } catch (e) {
        console.error('❌ 合约无法访问:', e);
        alert('无法连接到合约，请检查网络和合约地址');
        setEvents([]);
        return;
      }

      // 添加超时机制
      const queryWithTimeout = (promise, timeoutMs = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('查询超时')), timeoutMs)
          )
        ]);
      };

      let lastFoundEvent = -1;

      for (let i = 0; i < 50; i++) {
        try {
          // 使用超时包装查询
          const info = await queryWithTimeout(contract.getEventInfo(i));

          console.log(`✅ 活动 ${i}:`, {
            name: info.name,
            isActive: info.isActive,
            hasName: !!info.name,
            nameLength: info.name?.length
          });

          if (info && info.name && info.name.length > 0) {
            eventList.push({
              id: i,
              name: info.name,
              venue: info.venue,
              eventTime: Number(info.eventTime),
              ticketPrice: info.ticketPrice,
              maxTickets: Number(info.maxTickets),
              soldTickets: Number(info.soldTickets),
              isActive: info.isActive,
              ...localData[i]
            });
            lastFoundEvent = i;
            console.log(`✅ 已添加活动 ${i} 到列表`);
          }

          // 如果连续5个活动都找不到，提前退出
          if (i - lastFoundEvent > 5 && lastFoundEvent >= 0) {
            console.log(`✅ 连续5个活动未找到，提前结束查询（最后找到: ${lastFoundEvent}）`);
            break;
          }

        } catch (e) {
          console.log(`⚠️ 活动 ${i} 不存在或查询失败:`, e.message);

          // 如果是超时错误，继续下一个
          if (e.message === '查询超时') {
            continue;
          }
        }
      }

      console.log(`========== 加载完成，共 ${eventList.length} 个活动 ==========`);
      setEvents(eventList);
    } catch (error) {
      console.error('========== 加载活动列表失败 ==========');
      console.error('错误:', error);
      alert('加载活动列表失败: ' + error.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // 验证输入
      if (!formData.name.trim()) {
        throw new Error('请输入活动名称');
      }
      if (!formData.venue.trim()) {
        throw new Error('请输入活动地点');
      }
      if (!formData.eventTime) {
        throw new Error('请选择活动时间');
      }
      if (!formData.ticketPrice || Number(formData.ticketPrice) <= 0) {
        throw new Error('请输入有效的票价');
      }
      if (!formData.maxTickets || Number(formData.maxTickets) <= 0) {
        throw new Error('请输入有效的票数');
      }

      // 转换时间戳（确保是整数）
      const eventTimestamp = Math.floor(new Date(formData.eventTime).getTime() / 1000);

      // 转换价格（确保是 BigInt）
      const priceWei = ethers.parseEther(formData.ticketPrice.toString());

      // 准备参数
      const params = [
        formData.name,                    // string name
        formData.venue,                  // string venue
        BigInt(eventTimestamp),           // uint256 eventTime
        priceWei,                         // uint256 ticketPrice
        BigInt(formData.maxTickets),        // uint256 maxTickets
        formData.allowResale,               // bool allowResale
        formData.allowResale
          ? ethers.parseEther(formData.maxResalePrice || '0')  // uint256 maxResalePrice
          : BigInt(0),
        formData.allowResale && formData.resaleDeadline
          ? BigInt(Math.floor(new Date(formData.resaleDeadline).getTime() / 1000))  // uint256 resaleDeadline
          : BigInt(0),
      ];

      console.log('创建活动参数:', params);

      // 调用合约创建活动
      const contract = await getContract();
      const tx = await contract.createEvent(...params);
      console.log('交易已提交:', tx.hash);

      const receipt = await tx.wait();
      console.log('交易已确认');

      // 读取创建活动事件
      let createdEventId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === 'EventCreated') {
            createdEventId = Number(parsed.args.eventId);
          }
        } catch (e) {
          // 忽略无法解析的日志
        }
      }

      // 保存活动信息到本地存储
      if (createdEventId !== null) {
        saveEventData(createdEventId, {
          description: formData.description || '',
          imageUrl: formData.imageUrl || ''
        });
      }

      setSuccess(`✅ 活动"${formData.name}"创建成功！`);
      resetForm();

      // 调用成功回调
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('创建活动失败:', error);
      setError(error.message || '创建活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // 验证输入
      if (!formData.name.trim()) {
        throw new Error('请输入活动名称');
      }
      if (!formData.venue.trim()) {
        throw new Error('请输入活动地点');
      }
      if (!formData.eventTime) {
        throw new Error('请选择活动时间');
      }

      // 更新本地存储（智能合约不支持修改活动）
      saveEventData(editingEventId, {
        description: formData.description || '',
        imageUrl: formData.imageUrl || ''
      });

      setSuccess(`✅ 活动"${formData.name}"更新成功！`);
      setMode('list');
      resetForm();

      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('更新活动失败:', error);
      setError(error.message || '更新活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 将图片转换为Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        handleInputChange('imageUrl', base64);
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      venue: '',
      description: '',
      imageUrl: '',
      eventTime: '',
      ticketPrice: '',
      maxTickets: '',
      allowResale: false,
      maxResalePrice: '',
      resaleDeadline: '',
    });
    setImagePreview('');
    setEditingEventId(null);
  };

  const handleEdit = (event) => {
    setEditingEventId(event.id);
    setFormData({
      name: event.name,
      venue: event.venue,
      description: event.description || '',
      imageUrl: event.imageUrl || '',
      eventTime: new Date(event.eventTime * 1000).toISOString().slice(0, 16),
      ticketPrice: ethers.formatEther(event.ticketPrice),
      maxTickets: event.maxTickets,
      allowResale: false,
      maxResalePrice: '',
      resaleDeadline: '',
    });
    setImagePreview(event.imageUrl || '');
    setMode('edit');
  };

  const handleDelete = async (eventId) => {
    if (!confirm('确定要删除这个活动的本地数据吗？（智能合约上的活动不会被删除）')) {
      return;
    }

    try {
      // 从localStorage删除
      const localData = loadAllEventData();
      delete localData[eventId];
      localStorage.setItem('event_data', JSON.stringify(localData));

      setSuccess('✅ 活动数据已删除');
      loadEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('删除失败:', error);
      setError('删除失败');
    }
  };

  // 未连接钱包，显示引导界面
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            活动管理
          </h1>
          <p className="text-slate-500">连接钱包后即可管理活动</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Plus className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">请先连接钱包</h3>
          <p className="text-slate-500 text-center max-w-md">
            连接 MetaMask 钱包后即可创建和管理活动。
          </p>
        </div>
      </div>
    );
  }

  // 活动列表视图
  if (mode === 'list') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                活动管理
              </h1>
              <p className="text-sm sm:text-base text-slate-500">共 {events.length} 个活动</p>
            </div>
            <button
              onClick={() => setMode('create')}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>创建活动</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-2 sm:space-x-3">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
            <p className="text-sm sm:text-base text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-2 sm:space-x-3">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
            <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Event List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 animate-spin mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-slate-500">加载活动列表中...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">还没有创建活动</h3>
            <p className="text-sm sm:text-base text-slate-500 text-center max-w-sm">
              点击上方"创建活动"按钮发布第一个活动吧！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {event.imageUrl && (
                  <div className="h-40 sm:h-48 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2">{event.name}</h3>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{new Date(event.eventTime * 1000).toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{ethers.formatEther(event.ticketPrice)} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>已售 {event.soldTickets}/{event.maxTickets}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleEdit(event)}
                      className="flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs sm:text-sm font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>编辑</span>
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 创建/编辑活动视图
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => {
              setMode('list');
              resetForm();
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
              {mode === 'edit' ? '编辑活动' : '创建活动'}
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              {mode === 'edit' ? '更新活动信息和图片' : '发布新的演出活动'}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-2 sm:space-x-3">
          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
          <p className="text-sm sm:text-base text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-2 sm:space-x-3">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
          <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
        <form onSubmit={mode === 'edit' ? handleUpdate : handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* 活动名称 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    活动名称
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例如：周杰伦演唱会"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">活动名称创建后不可修改</p>
                )}
              </div>

              {/* 活动地点 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    活动地点
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例如：上海梅赛德斯-奔驰文化中心"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">活动地点创建后不可修改</p>
                )}
              </div>

              {/* 活动描述 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    活动简介
                  </span>
                </label>
                <textarea
                  placeholder="例如：周杰伦2025世界巡回演唱会，将带来经典歌曲和创新表演..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 resize-none text-sm sm:text-base"
                  rows="3"
                />
              </div>

              {/* 活动图片 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    活动图片
                  </span>
                </label>

                {/* 图片预览 */}
                {imagePreview && (
                  <div className="mb-3 sm:mb-4 relative">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="w-full h-36 sm:h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('imageUrl', '');
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}

                {/* 上传方式选择 */}
                <div className="space-y-2 sm:space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 cursor-pointer transition-colors bg-slate-50 w-full"
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                    <span className="text-xs sm:text-sm text-slate-600">上传图片</span>
                  </label>

                  <div className="text-center text-slate-400 text-xs sm:text-sm">或</div>

                  <div>
                    <label className="block text-[10px] sm:text-xs text-slate-600 mb-1.5 sm:mb-2">
                      或输入图片URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl && !formData.imageUrl.startsWith('data:') ? formData.imageUrl : ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        handleInputChange('imageUrl', url);
                        if (url) setImagePreview(url);
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* 活动时间 */}
              {mode === 'create' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      活动时间
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.eventTime}
                    onChange={(e) => handleInputChange('eventTime', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>
              )}

              {/* 票价 */}
              {mode === 'create' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      票价（ETH）
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="例如：0.001"
                    value={formData.ticketPrice}
                    onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            {mode === 'create' && (
              <div className="space-y-4 sm:space-y-6">
                {/* 总票数 */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      总票数
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="例如：1000"
                    value={formData.maxTickets}
                    onChange={(e) => handleInputChange('maxTickets', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>

                {/* 允许转售 */}
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                  <label className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowResale}
                      onChange={(e) => handleInputChange('allowResale', e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">允许转售</span>
                  </label>

                  {formData.allowResale && (
                    <div className="space-y-3 sm:space-y-4 pl-5 sm:pl-8">
                      {/* 最大转售价格 */}
                      <div>
                        <label className="block text-[10px] sm:text-xs text-slate-600 mb-1.5 sm:mb-2">
                          最大转售价格（ETH）
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="例如：0.0015"
                          value={formData.maxResalePrice}
                          onChange={(e) => handleInputChange('maxResalePrice', e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-xs sm:text-sm"
                        />
                      </div>

                      {/* 转售截止时间 */}
                      <div>
                        <label className="block text-[10px] sm:text-xs text-slate-600 mb-1.5 sm:mb-2">
                          转售截止时间
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.resaleDeadline}
                          onChange={(e) => handleInputChange('resaleDeadline', e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>{mode === 'edit' ? '更新中...' : '创建中...'}</span>
              </>
            ) : (
              <>
                {mode === 'edit' ? (
                  <>
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>更新活动</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>创建活动</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tips */}
      {mode === 'create' && (
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">💡 创建活动提示</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[10px] sm:text-sm text-indigo-600">1</span>
              </div>
              <p>支持上传图片或输入图片URL</p>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[10px] sm:text-sm text-indigo-600">2</span>
              </div>
              <p>图片大小建议不超过2MB</p>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[10px] sm:text-sm text-indigo-600">3</span>
              </div>
              <p>活动时间、地点、票价创建后不可修改</p>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[10px] sm:text-sm text-indigo-600">4</span>
              </div>
              <p>创建活动需要支付少量 Gas 费用</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

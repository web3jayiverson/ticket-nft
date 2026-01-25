import React, { useState, useEffect } from 'react';
import { X, Ticket, MapPin, AlertCircle, Calendar, Users } from 'lucide-react';
import { getEventImage } from '../utils/eventStorage';

const BuyTicketModal = ({ event, onClose, onConfirm, contract }) => {
  const [selectedSection, setSelectedSection] = useState('A区');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [soldSeats, setSoldSeats] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [seatCache, setSeatCache] = useState(new Map()); // 座位缓存

  // 根据活动票数动态计算座位布局
  const calculateSeatLayout = (totalTickets) => {
    const sections = 3; // 固定3个区域
    const seatsPerSection = Math.ceil(totalTickets / sections);

    // 计算排和座的分布
    // 常见的布局：8排×10座=80, 10排×10座=100, 12排×8座=96
    if (seatsPerSection <= 60) {
      return { rows: 6, seatsPerRow: 10 }; // 6排×10座=60
    } else if (seatsPerSection <= 80) {
      return { rows: 8, seatsPerRow: 10 }; // 8排×10座=80
    } else if (seatsPerSection <= 100) {
      return { rows: 10, seatsPerRow: 10 }; // 10排×10座=100
    } else if (seatsPerSection <= 120) {
      return { rows: 12, seatsPerRow: 10 }; // 12排×10座=120
    } else if (seatsPerSection <= 150) {
      return { rows: 10, seatsPerRow: 15 }; // 10排×15座=150
    } else {
      return { rows: 12, seatsPerRow: 15 }; // 12排×15座=180
    }
  };

  const { rows: totalRows, seatsPerRow } = calculateSeatLayout(
    Number(event.totalTickets) || 100
  );

  // 区域配置
  const sections = ['A区', 'B区', 'C区'];

  // 切换区域时清空缓存（不同区域的座位独立）
  useEffect(() => {
    setSeatCache(new Map());
    setSelectedSeat(null);
  }, [selectedSection]);

  // 加载已售座位信息
  useEffect(() => {
    if (contract && event) {
      loadSoldSeats();
    }
  }, [contract, event, selectedSection]);

  const loadSoldSeats = async () => {
    if (!contract || !event) return;

    try {
      setLoading(true);
      const sold = new Set();
      const totalSeats = totalRows * seatsPerRow;

      console.log(`开始加载座位，总计: ${totalSeats} 个 (${totalRows}排×${seatsPerRow}座)`);

      // 优化1：分批并发查询，每次查询 20 个座位
      const batchSize = 20;
      const batches = Math.ceil(totalSeats / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const startIdx = batch * batchSize;
        const endIdx = Math.min(startIdx + batchSize, totalSeats);

        // 创建该批次的查询 promises
        const queries = [];
        for (let i = startIdx; i < endIdx; i++) {
          const row = Math.floor(i / seatsPerRow) + 1;
          const seat = (i % seatsPerRow) + 1;
          const tokenId = event.id * 10000 + row * 100 + seat;
          const seatKey = `${row}-${seat}`;

          // 优化2：检查缓存
          if (seatCache.has(seatKey)) {
            if (seatCache.get(seatKey)) {
              sold.add(seatKey);
            }
            continue;
          }

          queries.push(
            contract.ownerOf(tokenId)
              .then(owner => {
                // 如果有 owner，说明已售
                if (owner && owner !== '0x0000000000000000000000000000000000000000') {
                  return { key: seatKey, isSold: true };
                }
                return { key: seatKey, isSold: false };
              })
              .catch(() => {
                // 查询失败，说明未售出
                return { key: seatKey, isSold: false };
              })
          );
        }

        // 并发执行该批次
        const results = await Promise.all(queries);

        // 处理结果
        results.forEach(result => {
          if (result.isSold) {
            sold.add(result.key);
          }
          // 更新缓存
          seatCache.set(result.key, result.isSold);
        });

        // 更新已售座位（渐进式更新）
        setSoldSeats(new Set(sold));

        console.log(`批次 ${batch + 1}/${batches} 完成，进度: ${Math.round(((batch + 1) / batches) * 100)}%`);
      }

      console.log(`✅ 座位加载完成，已售: ${sold.size} 个`);
    } catch (error) {
      console.error('加载已售座位失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (row, seat) => {
    const seatKey = `${row}-${seat}`;
    
    // 如果座位已售，不允许选择
    if (soldSeats.has(seatKey)) {
      return;
    }

    if (selectedSeat && selectedSeat.row === row && selectedSeat.seat === seat) {
      // 取消选择
      setSelectedSeat(null);
    } else {
      // 选择新座位
      setSelectedSeat({ section: selectedSection, row, seat });
    }
  };

  const getSeatStatus = (row, seat) => {
    const seatKey = `${row}-${seat}`;
    
    if (soldSeats.has(seatKey)) {
      return 'sold';
    }
    
    if (selectedSeat && selectedSeat.row === row && selectedSeat.seat === seat) {
      return 'selected';
    }
    
    return 'available';
  };

  const handleConfirm = () => {
    if (selectedSeat) {
      onConfirm(selectedSeat);
    }
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {/* Event Image */}
          <div className="relative h-48 sm:h-64 overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
            <img
              src={getEventImage(event.id, event.name)}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">{event.name}</h2>
                  <div className="flex flex-wrap items-center text-white/90 gap-2 sm:gap-4">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm">{event.venue}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm">已售 {event.soldTickets}/{event.totalTickets}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <div className="px-6 pb-4 border-b border-slate-100">
            <p className="text-sm text-slate-600 line-clamp-2">
              {event.description}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Section Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
              选择区域
            </label>
            <div className="flex space-x-2 sm:space-x-3">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    setSelectedSection(section);
                    setSelectedSeat(null);
                  }}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    selectedSection === section
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="relative">
              <div className="h-8 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-6 sm:mb-8 shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">舞台 STAGE</span>
              </div>
              <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 h-3 sm:h-4 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-lg"></div>
            </div>
          </div>

          {/* Seat Map */}
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-slate-600">加载座位信息...</p>
              </div>
            </div>
          ) : (
            <div className="mb-4 sm:mb-6">
              {/* Legend */}
              <div className="flex items-center justify-center space-x-3 sm:space-x-6 mb-4 sm:mb-6">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-600 rounded shadow"></div>
                  <span className="text-xs sm:text-sm text-slate-600">可选</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-300 rounded shadow"></div>
                  <span className="text-xs sm:text-sm text-slate-600">已售</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded shadow ring-3 sm:ring-4 ring-indigo-300"></div>
                  <span className="text-xs sm:text-sm text-slate-600">已选</span>
                </div>
              </div>

              {/* Seats Grid */}
              <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                {Array.from({ length: totalRows }, (_, rowIdx) => {
                  const row = rowIdx + 1;
                  return (
                    <div key={row} className="flex items-center space-x-1.5 sm:space-x-2 min-w-max">
                      <span className="text-xs text-slate-500 w-5 sm:w-6 text-center font-semibold">
                        {row}排
                      </span>
                      <div className="flex space-x-1 sm:space-x-2">
                        {Array.from({ length: seatsPerRow }, (_, seatIdx) => {
                          const seat = seatIdx + 1;
                          const status = getSeatStatus(row, seat);

                          return (
                            <button
                              key={`${row}-${seat}`}
                              onClick={() => handleSeatClick(row, seat)}
                              disabled={status === 'sold'}
                              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm transition-all hover:scale-110 ${
                                status === 'sold'
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : status === 'selected'
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 ring-3 sm:ring-4 ring-indigo-300 cursor-pointer'
                                  : 'bg-indigo-600 cursor-pointer hover:bg-indigo-700'
                              }`}
                              title={`${row}排${seat}座`}
                            >
                              <span className="text-white text-[10px] sm:text-xs font-semibold">
                                {seat}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Seat Info */}
          {selectedSeat && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="font-bold text-base sm:text-lg text-slate-900 mb-0.5 sm:mb-1">已选座位</h4>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">
                    {selectedSeat.section} · {selectedSeat.row}排{selectedSeat.seat}座
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span className="text-sm sm:text-base font-semibold text-slate-900">总价</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {event.price} ETH
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 sm:mb-6">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800">
              请仔细确认座位信息，门票购买后不支持退款。灰色座位表示已售出，不可选择。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl sm:rounded-b-3xl sticky bottom-0">
          <button
            onClick={handleConfirm}
            disabled={!selectedSeat}
            className={`w-full py-3 sm:py-4 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] text-sm sm:text-base ${
              selectedSeat
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {selectedSeat ? `确认购买 ${event.price} ETH` : '请选择座位'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTicketModal;

import React from 'react';
import { Ticket, CheckCircle, XCircle, MapPin, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// 生成随机票号（混淆 Token ID）
const BASE = 10000000; // 基数，用于混淆
const SUFFIX_RANGE = 10000; // 后缀随机范围

const formatTicketCode = (tokenId) => {
  const tokenNum = Number(tokenId);
  // 使用伪随机算法基于 tokenId 生成确定性的后缀（0-9999）
  // 这样同一个 tokenId 永远生成相同的核销码
  const randomSuffix = (tokenNum * 9301 + 49297) % 233280 % SUFFIX_RANGE;
  // 组合：Token ID * 基数 + 随机后缀
  const code = tokenNum * BASE + randomSuffix;
  // 转换为 9-10 位数字
  return String(code);
};

// 解析票号（还原 Token ID）
const parseTicketCode = (code) => {
  const codeNum = parseInt(code, 10);
  // 反向计算：除以基数
  const tokenId = Math.floor(codeNum / BASE);
  return tokenId;
};

const TicketCard = ({ ticket }) => {
  const { tokenId, eventName, section, row, seat, isVerified } = ticket;
  const displayCode = formatTicketCode(tokenId);

  return (
    <div className="bg-white bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 rounded-2xl shadow-lg p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50"></div>
      
        {/* Event Info */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{eventName}</h3>
              <p className="text-sm text-slate-500">票号: {displayCode}</p>
            </div>
          </div>
          
          {isVerified ? (
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>已使用</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              <Clock className="w-4 h-4" />
              <span>有效</span>
            </div>
          )}
        </div>

        {/* Seat Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-slate-700">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-600" />
            <span className="text-sm font-medium">{section} - {row}排{seat}座</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl shadow-inner border-2 border-dashed border-indigo-200">
          <div className="flex flex-col items-center">
            <QRCodeSVG
              value={displayCode}
              size={200}
              level="H"
              includeMargin={true}
              className="mb-4"
            />
            <p className="text-sm font-semibold text-slate-600 mb-3">扫码入场</p>

            {/* 票号显示 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 w-full text-center border border-indigo-200">
              <p className="text-xs text-slate-500 mb-1">核销码（与二维码相同）</p>
              <p className="text-3xl font-bold text-indigo-600 tracking-wider font-mono">
                {displayCode}
              </p>
              <p className="text-xs text-slate-400 mt-2">如无法扫码，请手动输入此数字</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          {isVerified ? (
            <div className="flex items-center justify-center space-x-2 text-slate-500">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">门票已核销</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-indigo-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">门票有效，可入场</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;

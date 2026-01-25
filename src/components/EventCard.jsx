import React from 'react';
import { MapPin, Calendar, Ticket, TrendingUp } from 'lucide-react';
import { getEventImage } from '../utils/eventStorage';

const EventCard = ({ event, onSelect, isSelected }) => {
  const { id, name, venue, description, date, price, soldTickets, totalTickets } = event;
  const sold = Number(soldTickets);
  const max = Number(totalTickets);
  const soldPercent = max > 0 ? Math.round((sold / max) * 100) : 0;

  return (
    <div
      onClick={() => onSelect(event)}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-xl ${
        isSelected
          ? 'scale-105 ring-4 ring-indigo-500 shadow-2xl'
          : 'hover:scale-102'
      }`}
    >
      {/* Event Image */}
      <div className="relative h-48 -mt-0 overflow-hidden">
        <img
          src={getEventImage(id, name)}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {soldPercent > 80 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
            热门
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center text-white/90">
            <Ticket className="w-4 h-4 mr-1" />
            <span className="text-xs font-semibold">演唱会</span>
          </div>
        </div>
      </div>

      {/* Event Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{name}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{venue}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{date}</span>
          </div>
        </div>

        {/* Price & Sold */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-1">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {price}
            </span>
            <span className="text-sm font-semibold text-slate-600">ETH</span>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">{sold}/{max}</div>
              <div className="text-xs text-slate-500">已售 {soldPercent}%</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${soldPercent}%` }}
          ></div>
        </div>

        {/* Description Hint */}
        {isSelected && (
          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-slate-600 text-center">
              点击查看座位选择
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;

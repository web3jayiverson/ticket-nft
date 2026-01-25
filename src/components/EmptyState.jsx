import React from 'react';
import { Ticket, Search, Wallet } from 'lucide-react';

const EmptyState = ({ type }) => {
  const states = {
    'no-events': {
      icon: Ticket,
      title: '暂无可用活动',
      description: '目前还没有发布任何活动，敬请期待！',
    },
    'no-tickets': {
      icon: Ticket,
      title: '还没有购买门票',
      description: '去票务中心选择你感兴趣的活动吧！',
    },
    'no-search': {
      icon: Search,
      title: '查询结果为空',
      description: '请检查票号是否正确',
    },
    'connect-wallet': {
      icon: Wallet,
      title: '请先连接钱包',
      description: '连接 MetaMask 钱包后即可使用所有功能',
    },
  };

  const { icon: Icon, title, description } = states[type] || states['no-events'];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;

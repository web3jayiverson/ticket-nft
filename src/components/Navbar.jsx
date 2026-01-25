import React, { useState } from 'react';
import { Menu, X, Ticket, Home, Shield, User, CheckCircle } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = ({ onNavigate, currentPage, account, isConnected, isOwner, onConnect, onDisconnect, onSwitchChain, currentChain }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('=== Navbar 渲染 ===');
  console.log('isOwner:', isOwner);
  console.log('navItems will include admin pages:', isOwner);

  const navItems = [
    { id: 'home', label: '票务中心', icon: Home },
    { id: 'my-tickets', label: '我的门票', icon: Ticket },
    ...(isOwner ? [{ id: 'verify', label: '门票核销', icon: Shield }, { id: 'admin', label: '管理后台', icon: User }] : []),
  ];

  console.log('Final navItems:', navItems);

  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  const isSepolia = currentChain?.id === 11155111;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TicketChain
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && !isSepolia && (
              <button
                onClick={onSwitchChain}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-all font-semibold"
              >
                <span>切换到 Sepolia</span>
              </button>
            )}
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-200 space-y-2">
              {isConnected && !isSepolia && (
                <button
                  onClick={onSwitchChain}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-amber-50 text-amber-700 rounded-xl font-semibold"
                >
                  <span>切换到 Sepolia 网络</span>
                </button>
              )}
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

/**
 * 票务系统 - 安全监控配置
 *
 * 上线后运行此监控脚本，实时检测异常交易和攻击
 */

import { ethers } from 'ethers';

// 合约配置
const CONFIG = {
  CONTRACT_ADDRESS: '0x98c6af4c16F492ECD21206f17Ace979CcF021f98',
  RPC_URL: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  ALERT_WEBHOOK: 'https://your-alert-service.com/webhook', // 可选
  MONITOR_INTERVAL: 10000, // 10秒检查一次
};

// 监控阈值
const THRESHOLDS = {
  // 单用户短时间内购买票数上限
  MAX_TICKETS_PER_HOUR: 10,

  // 单活动短时间内售罄速度（秒）
  MIN_TIME_TO_SOLD_OUT: 60,

  // 单笔交易最大 Gas 使用
  MAX_GAS_PER_TX: 500000,

  // 单笔交易最大 ETH 金额
  MAX_ETH_PER_TX: ethers.parseEther('10'),

  // 价格偏差阈值（用于检测价格操纵）
  PRICE_DEVIATION_PERCENT: 50, // 50%
};

// 告警级别
const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

class SecurityMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      [
        "event TicketPurchased(uint256 indexed tokenId, uint256 eventId, address buyer)",
        "event EventCreated(uint256 indexed eventId, string name, uint256 eventTime)",
        "event TicketVerified(uint256 indexed tokenId, address verifier)",
      ],
      this.provider
    );

    this.userPurchaseHistory = new Map(); // 用户购买历史
    this.eventSoldOutTime = new Map(); // 活动售罄时间
    this.alerts = [];

    this.init();
  }

  async init() {
    console.log('🛡️  安全监控系统启动');
    console.log('📊  监控合约:', CONFIG.CONTRACT_ADDRESS);

    // 启动监控循环
    setInterval(() => this.checkAnomalies(), CONFIG.MONITOR_INTERVAL);

    // 监听事件
    this.setupEventListeners();

    // 获取初始状态
    await this.loadInitialState();
  }

  async loadInitialState() {
    console.log('📥  加载初始状态...');

    // 获取所有活动
    try {
      for (let i = 0; i < 50; i++) {
        try {
          const contract = new ethers.Contract(
            CONFIG.CONTRACT_ADDRESS,
            ["function getEventInfo(uint256) view returns (...)"],
            this.provider
          );

          const info = await contract.getEventInfo(i);
          if (info.soldTickets === info.maxTickets) {
            this.eventSoldOutTime.set(i, Date.now());
          }
        } catch (e) {
          break;
        }
      }
    } catch (error) {
      console.error('❌ 加载初始状态失败:', error);
    }
  }

  setupEventListeners() {
    // 监听购买事件
    this.contract.on('TicketPurchased', (tokenId, eventId, buyer) => {
      this.handleTicketPurchase(tokenId, eventId, buyer);
    });

    // 监听活动创建事件
    this.contract.on('EventCreated', (eventId, name, eventTime) => {
      this.handleEventCreation(eventId, name, eventTime);
    });

    // 监听票务核销事件
    this.contract.on('TicketVerified', (tokenId, verifier) => {
      this.handleTicketVerification(tokenId, verifier);
    });

    console.log('🎧  事件监听器已设置');
  }

  handleTicketPurchase(tokenId, eventId, buyer) {
    const timestamp = Date.now();
    const buyerLower = buyer.toLowerCase();

    console.log(`🎫  购票事件: Token ${tokenId}, 活动 ${eventId}, 买家 ${buyer}`);

    // 记录用户购买历史
    if (!this.userPurchaseHistory.has(buyerLower)) {
      this.userPurchaseHistory.set(buyerLower, []);
    }

    const history = this.userPurchaseHistory.get(buyerLower);
    history.push({ tokenId, eventId, timestamp });
    this.userPurchaseHistory.set(buyerLower, history);

    // 检查: 单用户短时间内大量购买
    this.checkUserPurchaseSpam(buyerLower);

    // 检查: 活动异常快速售罄
    this.checkEventSoldOutSpeed(eventId);
  }

  checkUserPurchaseSpam(buyer) {
    const history = this.userPurchaseHistory.get(buyer) || [];
    const oneHourAgo = Date.now() - 3600000; // 1小时前

    // 统计1小时内的购买
    const recentPurchases = history.filter(
      p => p.timestamp > oneHourAgo
    );

    if (recentPurchases.length > THRESHOLDS.MAX_TICKETS_PER_HOUR) {
      const alert = {
        level: ALERT_LEVELS.WARNING,
        type: 'USER_PURCHASE_SPAM',
        message: `用户 ${buyer} 在1小时内购买了 ${recentPurchases.length} 张票`,
        details: recentPurchases,
        timestamp: Date.now(),
      };

      this.triggerAlert(alert);
    }
  }

  async checkEventSoldOutSpeed(eventId) {
    try {
      const contract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        ["function getEventInfo(uint256) view returns (...)"],
        this.provider
      );

      const info = await contract.getEventInfo(eventId);

      if (info.soldTickets === info.maxTickets && !this.eventSoldOutTime.has(eventId)) {
        const sellOutTime = Date.now();
        this.eventSoldOutTime.set(eventId, sellOutTime);

        // 检查售罄速度（这里简化处理，实际应该记录活动创建时间）
        const alert = {
          level: ALERT_LEVELS.INFO,
          type: 'EVENT_SOLD_OUT',
          message: `活动 ${eventId} 已售罄`,
          details: {
            eventId,
            soldTickets: info.soldTickets,
            maxTickets: info.maxTickets,
          },
          timestamp: sellOutTime,
        };

        this.triggerAlert(alert);
      }
    } catch (error) {
      console.error('❌ 检查售罄速度失败:', error);
    }
  }

  handleEventCreation(eventId, name, eventTime) {
    console.log(`📅  活动创建: ID ${eventId}, 名称 ${name}`);

    const alert = {
      level: ALERT_LEVELS.INFO,
      type: 'EVENT_CREATED',
      message: `新活动创建: ${name}`,
      details: { eventId, name, eventTime },
      timestamp: Date.now(),
    };

    this.triggerAlert(alert);
  }

  handleTicketVerification(tokenId, verifier) {
    console.log(`✅  票务核销: Token ${tokenId}, 核销人 ${verifier}`);

    // 验证核销人是否为 owner
    // 这里需要获取合约 owner 地址进行比较
  }

  triggerAlert(alert) {
    console.log(`🚨  [${alert.level.toUpperCase()}] ${alert.message}`);
    console.log('   详情:', alert.details);

    // 保存告警
    this.alerts.push(alert);

    // 发送到 Webhook（如果配置）
    if (CONFIG.ALERT_WEBHOOK) {
      this.sendAlertToWebhook(alert);
    }

    // 严重告警立即通知
    if (alert.level === ALERT_LEVELS.CRITICAL) {
      console.error('🚨🚨🚨  严重安全告警！');
      // 这里可以添加邮件、短信等通知方式
    }
  }

  async sendAlertToWebhook(alert) {
    try {
      await fetch(CONFIG.ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      console.log('✅  告警已发送到 Webhook');
    } catch (error) {
      console.error('❌ 发送告警失败:', error);
    }
  }

  async checkAnomalies() {
    // 定期检查异常情况
    console.log('🔍  定期安全检查...');

    // 1. 检查合约余额异常
    await this.checkContractBalance();

    // 2. 检查 Gas 使用异常
    await this.checkGasUsage();

    // 3. 清理过期历史记录
    this.cleanupOldRecords();
  }

  async checkContractBalance() {
    try {
      const balance = await this.provider.getBalance(CONFIG.CONTRACT_ADDRESS);
      const balanceEth = parseFloat(ethers.formatEther(balance));

      console.log(`💰  合约余额: ${balanceEth} ETH`);

      // 如果余额过大，可能异常
      if (balanceEth > 100) {
        const alert = {
          level: ALERT_LEVELS.WARNING,
          type: 'HIGH_BALANCE',
          message: `合约余额过高: ${balanceEth} ETH`,
          details: { balance: balanceEth },
          timestamp: Date.now(),
        };
        this.triggerAlert(alert);
      }
    } catch (error) {
      console.error('❌ 检查合约余额失败:', error);
    }
  }

  async checkGasUsage() {
    // 这里需要查询历史交易来分析 Gas 使用
    // 简化实现，实际应该使用 Etherscan API
    console.log('⛽  Gas 使用分析（待实现）');
  }

  cleanupOldRecords() {
    const oneDayAgo = Date.now() - 86400000;

    // 清理超过24小时的购买记录
    for (const [user, history] of this.userPurchaseHistory) {
      const recent = history.filter(p => p.timestamp > oneDayAgo);
      this.userPurchaseHistory.set(user, recent);
    }
  }

  getAlerts() {
    return this.alerts;
  }

  getAlertsByLevel(level) {
    return this.alerts.filter(a => a.level === level);
  }

  clearAlerts() {
    this.alerts = [];
    console.log('🗑️  告警记录已清空');
  }
}

// 启动监控
if (typeof window !== 'undefined') {
  // 在浏览器中运行
  window.securityMonitor = new SecurityMonitor();
} else {
  // 在 Node.js 中运行
  const monitor = new SecurityMonitor();
}

export default SecurityMonitor;

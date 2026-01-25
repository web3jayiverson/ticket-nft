# Wagmi + Viem + RainbowKit 安装配置指南

## 1. 安装依赖

```bash
cd C:/Users/Administrator/desktop/ticket
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

## 2. 获取WalletConnect项目ID

1. 访问 https://cloud.walletconnect.com
2. 注册/登录账号
3. 创建新项目
4. 复制项目ID

## 3. 配置WalletConnect项目ID

打开 `src/config/wagmi.js`，替换项目ID：

```javascript
export const config = getDefaultConfig({
  appName: 'TicketChain',
  projectId: '你的项目ID', // 替换这里
  chains: [sepolia],
  ssr: true,
});
```

## 4. 启动开发服务器

```bash
npm run dev
```

## 5. 测试功能

### 连接钱包
- 点击右上角"连接钱包"按钮
- 弹出钱包选择界面
- 支持多种钱包：MetaMask、WalletConnect、Coinbase、Rainbow等

### 切换网络
- 如果不在Sepolia网络，会显示"切换到Sepolia"按钮
- 点击后会自动切换到Sepolia测试网

### 购票流程
- 连接钱包后，在首页选择活动
- 点击"立即购买"
- 选择座位
- 确认交易（在钱包中）
- 等待交易确认

## 已完成的改造

### ✅ 核心架构
- [x] Wagmi Provider配置
- [x] RainbowKit集成
- [x] React Query配置
- [x] 多钱包支持

### ✅ 主要组件
- [x] App.jsx - 使用wagmi hooks
- [x] Navbar.jsx - RainbowKit ConnectButton
- [x] 工具函数 - contractUtils.js

### ⏳ 待完成页面
需要将以下页面从ethers.js迁移到wagmi/viem：
- [ ] Home.jsx - 活动列表
- [ ] MyTickets.jsx - 我的门票
- [ ] Verify.jsx - 门票核销
- [ ] Admin.jsx - 管理后台
- [ ] BuyTicketModal.jsx - 购票弹窗

## 关键改动说明

### 1. 移除ethers.js
```javascript
// 旧代码
import { ethers } from 'ethers';
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(address, abi, signer);

// 新代码
import { useReadContract, useWriteContract } from 'wagmi';
// 使用hooks，无需手动创建provider和contract
```

### 2. 使用BigInt
```javascript
// 旧代码
const priceWei = ethers.parseEther('0.001');
const tokenId = ethers.getBigInt(1);

// 新代码
const priceWei = BigInt(1000000000000000);
const tokenId = BigInt(1);
```

### 3. 合约调用方式
```javascript
// 旧代码
const info = await contract.getEventInfo(eventId);

// 新代码
const { data: info } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getEventInfo',
  args: [eventId],
});
```

## 支持的钱包列表

RainbowKit默认支持以下钱包：

### Web钱包
- MetaMask
- Coinbase Wallet
- Rainbow
- Trust Wallet
- Argent
- Braavos

### WalletConnect兼容
- Ledger
- Trezor
- Safe
- Gnosis Safe
- 以及所有支持WalletConnect的钱包

## 故障排除

### 1. 连接失败
- 确保已安装钱包扩展
- 检查网络是否正确（Sepolia）
- 查看浏览器控制台错误

### 2. 交易失败
- 确保钱包有足够的ETH
- 检查Gas费用设置
- 查看交易详情和错误信息

### 3. WalletConnect连接失败
- 检查WalletConnect项目ID是否正确
- 确保钱包应用支持WalletConnect
- 尝试刷新页面重试

## 参考资源

- [Wagmi文档](https://wagmi.sh/)
- [Viem文档](https://viem.sh/)
- [RainbowKit文档](https://www.rainbowkit.com/)
- [WalletConnect文档](https://docs.walletconnect.com/)

## 下一步

1. 安装依赖：`npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query`
2. 配置WalletConnect项目ID
3. 更新剩余页面（参考WAGMI_EXAMPLES.jsx）
4. 测试所有功能
5. 部署到生产环境

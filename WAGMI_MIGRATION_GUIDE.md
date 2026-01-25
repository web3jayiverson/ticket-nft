# Wagmi + Viem + RainbowKit 迁移指南

## 已完成的改动

### 1. 依赖安装
需要安装以下依赖：
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### 2. 配置文件

#### src/config/wagmi.js
已创建Wagmi配置文件，包含：
- 默认配置
- Sepolia测试网络
- WalletConnect项目ID（需要替换）

#### src/main.jsx
已添加：
- WagmiProvider
- QueryClientProvider
- RainbowKitProvider（深色主题）
- RainbowKit样式导入

### 3. 核心组件更新

#### src/App.jsx
已重写，使用：
- `useAccount` - 获取账户和连接状态
- `useConnect` - 连接钱包
- `useDisconnect` - 断开连接
- `useSwitchChain` - 切换链
- `useReadContract` - 读取合约数据
- `useWriteContract` - 写入合约数据
- `useWaitForTransactionReceipt` - 等待交易确认

**注意**：移除了所有ethers.js代码，改用viem类型处理（BigInt）

#### src/components/Navbar.jsx
已更新：
- 使用RainbowKit的`ConnectButton`组件
- 支持多钱包连接
- 添加网络切换提示
- 移动端适配

### 4. 需要更新的页面

以下页面需要将ethers.js替换为wagmi/viem：

#### src/pages/Home.jsx
需要改动：
- 移除ethers导入
- 使用`useReadContract`读取活动信息
- 价格处理使用BigInt而不是ethers的parseEther

#### src/pages/MyTickets.jsx
需要改动：
- 移除ethers导入
- 使用`useReadContract`和`useWatchContractEvent`
- 门票查询逻辑使用viem

#### src/pages/Verify.jsx
需要改动：
- 移除ethers导入
- 使用`useReadContract`和`useWriteContract`
- 核销操作使用viem

#### src/pages/Admin.jsx
需要改动：
- 移除ethers导入
- 使用`useReadContract`和`useWriteContract`
- 创建/更新活动使用viem

#### src/components/BuyTicketModal.jsx
需要改动：
- 移除ethers导入
- 使用父组件传入的contract和函数
- 座位查询使用viem

## 关键差异

### BigInt处理
```javascript
// ethers.js
const priceWei = ethers.parseEther(price);
const tx = await contract.buyTicket(..., { value: priceWei });

// viem/wagmi
const priceWei = BigInt(Math.floor(price * 1e18));
writeContract({
  functionName: 'buyTicket',
  args: [...],
  value: priceWei,
});
```

### 合约读取
```javascript
// ethers.js
const info = await contract.getEventInfo(eventId);

// wagmi
const { data: info } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getEventInfo',
  args: [eventId],
});
```

### 交易发送
```javascript
// ethers.js
const tx = await contract.buyTicket(..., { value });
await tx.wait();

// wagmi
const { writeContract } = useWriteContract();
writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'buyTicket',
  args: [...],
  value,
});

// 等待确认
const { isSuccess } = useWaitForTransactionReceipt({ hash });
```

## WalletConnect项目ID

需要访问 https://cloud.walletconnect.com 注册并获取项目ID，然后替换：

```javascript
// src/config/wagmi.js
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
```

临时可以使用测试ID：`YOUR_WALLETCONNECT_PROJECT_ID`（但有限制）

## 支持的钱包

RainbowKit默认支持以下钱包：
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow
- Trust Wallet
- Ledger
- Argent
- 以及更多...

## 下一步

1. 运行 `npm install` 安装依赖
2. 替换WalletConnect项目ID
3. 逐个更新剩余页面（Home, MyTickets, Verify, Admin, BuyTicketModal）
4. 测试所有功能

## 参考文档

- [Wagmi文档](https://wagmi.sh/)
- [Viem文档](https://viem.sh/)
- [RainbowKit文档](https://www.rainbowkit.com/)

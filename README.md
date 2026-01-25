# Ticket NFT Web Application

基于Web3的票务NFT管理系统，支持活动创建、门票销售、NFT铸造和二维码验证等功能。

## 🎯 项目特性

- **活动管理**：创建和管理票务活动
- **NFT票务**：基于以太坊区块链的NFT门票系统
- **Web3集成**：使用Wagmi和RainbowKit实现钱包连接
- **二维码验证**：支持票务二维码生成和验证
- **响应式设计**：基于Tailwind CSS的现代化UI

## 🚀 技术栈

- **前端框架**：React 19 + Vite 7
- **样式**：Tailwind CSS 4.0
- **Web3库**：Wagmi 2.14 + Viem 2.22
- **钱包连接**：RainbowKit 2.2
- **合约交互**：ethers.js 6.16
- **智能合约**：Solidity (TicketNFT_Fixed.sol)

## 📦 安装

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🔧 配置

项目需要配置环境变量（`.env`文件）：

```env
VITE_CHAIN_ID=1
VITE_CONTRACT_ADDRESS=0x...
```

## 🌐 部署

### GitHub部署

1. 在GitHub上创建新仓库
2. 添加远程仓库并推送代码：

```bash
# 添加远程仓库（替换YOUR_USERNAME和REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### Vercel部署

1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入GitHub仓库
4. 配置构建设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 "Deploy"

项目将自动部署并获得一个Vercel URL。

## 📄 文档

- [部署指南](DEPLOYMENT_GUIDE.md) - 智能合约部署详细说明
- [优化总结](OPTIMIZATION_SUMMARY.md) - 性能优化详情
- [故障排除](TROUBLESHOOTING.md) - 常见问题解决方案
- [审计清单](AUDIT_CHECKLIST.md) - 安全审计要点

## 📝 许可证

Private - All rights reserved

# 完整的安装和修复步骤

## 问题：Invalid hook call 错误

已完成的修复：
- ✅ 修复了 `useWaitForTransactionReceipt` hook的调用问题
- ✅ 简化了Home.jsx，移除可能导致问题的复杂逻辑
- ✅ 更新了package.json，添加了所有必需的依赖

## 立即执行的命令

在 PowerShell 中运行以下命令：

```powershell
# 进入项目目录
cd C:/Users/Administrator/desktop/ticket

# 步骤1：清理旧的依赖
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 步骤2：重新安装所有依赖（包括Wagmi）
npm install

# 步骤3：启动开发服务器
npm run dev
```

## 清除浏览器缓存

在浏览器中：

1. **Chrome/Edge**:
   - 按 `Ctrl + Shift + Delete`
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **Firefox**:
   - 按 `Ctrl + Shift + Delete`
   - 选择"缓存"
   - 点击"立即清除"

3. **或者使用开发者工具**:
   - 按 `F12` 打开开发者工具
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

## 验证安装成功

安装成功后，在浏览器中应该能看到：

### 1. 页面正常加载
- ✅ 没有控制台错误
- ✅ 导航栏显示正确
- ✅ "连接钱包"按钮可见

### 2. 点击"连接钱包"
- ✅ 弹出RainbowKit钱包选择界面
- ✅ 显示多个钱包选项（MetaMask、WalletConnect等）

### 3. 选择钱包
- ✅ MetaMask弹出授权请求
- ✅ 或者扫描WalletConnect二维码
- ✅ 连接成功后显示钱包地址

## 如果仍然报错

### 错误：找不到模块 'wagmi'

**原因**：依赖未正确安装

**解决**：
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### 错误：Module not found: Can't resolve '@rainbow-me/rainbowkit'

**解决**：
```bash
npm install @rainbow-me/rainbowkit
```

### 错误：仍然显示 "Invalid hook call"

**原因**：浏览器缓存或依赖冲突

**解决**：
1. 完全关闭浏览器
2. 清除浏览器缓存（见上面步骤）
3. 重新打开浏览器
4. 访问 http://localhost:5173

## 测试功能清单

连接钱包后，测试以下功能：

### 基础功能
- [ ] 页面加载成功
- [ ] 钱包连接成功
- [ ] 显示钱包地址（简写形式）
- [ ] 网络检测正常

### 多钱包测试
- [ ] MetaMask 连接
- [ ] WalletConnect 二维码显示
- [ ] 钱包切换功能

### 活动浏览
- [ ] 活动列表加载
- [ ] 搜索功能正常
- [ ] 活动卡片显示正确

## 如果所有方法都失败：回退方案

### 回退到原始ethers.js版本

**步骤1**：恢复main.jsx
```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**步骤2**：使用git恢复原始版本（如果有git历史）
```bash
git checkout src/main.jsx src/App.jsx src/components/Navbar.jsx
```

**步骤3**：或者手动恢复这些文件的原始版本

这样可以保证网站继续正常运行，之后再慢慢迁移Wagmi。

## 常见问题FAQ

### Q1: 为什么会出现hooks错误？
A: React Hooks必须在组件的顶层调用，不能在条件语句、循环或嵌套函数中使用。之前的代码可能在某些情况下违反了这个规则，现已修复。

### Q2: Wagmi比ethers.js好吗？
A: Wagmi是现代化的React hooks库，提供更好的类型安全、性能和开发者体验。Viem比ethers.js更快更轻量。RainbowKit提供优美的钱包选择UI。

### Q3: 支持哪些钱包？
A:
- MetaMask
- WalletConnect（支持200+钱包）
- Coinbase Wallet
- Rainbow
- Trust Wallet
- Argent
- Ledger
- 以及更多...

### Q4: 如何获取WalletConnect项目ID？
A:
1. 访问 https://cloud.walletconnect.com
2. 注册/登录
3. 创建新项目
4. 复制项目ID

### Q5: 可以同时使用ethers.js和wagmi吗？
A: 可以，但不推荐。建议统一使用一个库以避免冲突。

## 下一步

修复成功后：

1. ✅ 测试钱包连接功能
2. ✅ 测试多钱包切换
3. ✅ 逐步迁移其他页面（MyTickets, Verify, Admin, BuyTicketModal）
4. ✅ 完整测试购票流程

## 需要帮助？

提供以下信息以获得更好的帮助：
1. 完整的错误信息（截图或文本）
2. 浏览器控制台输出（F12 -> Console）
3. package.json内容
4. 运行的命令和输出

---

**最后更新**: 当前版本已修复主要hooks问题，请按照步骤操作。

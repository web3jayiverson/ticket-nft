# 故障排除指南

## 错误：Invalid hook call

如果看到以下错误：
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
```

### 已修复的问题
✅ 已修复 `useWaitForTransactionReceipt` 在hash为null时的问题
✅ 已简化Home.jsx，移除复杂的合约调用

### 解决方案

#### 1. 清除缓存并重新安装

```bash
# 删除node_modules和lock文件
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 启动开发服务器
npm run dev
```

Windows命令：
```bash
# 删除node_modules和lock文件
rmdir /s /q node_modules
del package-lock.json

# 重新安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 2. 检查依赖是否正确安装

确保以下依赖已安装：
```bash
npm list wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

如果没有安装，运行：
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

#### 3. 检查React版本冲突

确保package.json中的React版本是19.x：
```json
"dependencies": {
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

如果有多个React版本，清理并重新安装：
```bash
rm -rf node_modules
npm install
```

#### 4. 浏览器清除缓存

1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

#### 5. 检查控制台错误

打开浏览器开发者工具（F12），查看Console标签页，查找：
- 红色错误信息
- 警告信息
- 加载失败的资源

#### 6. 临时回退到ethers.js

如果Wagmi问题无法解决，可以临时回退：

**main.jsx** 恢复为：
```jsx
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

**App.jsx** 使用备份版本（如果有的话）

## 其他常见问题

### 问题：找不到模块 'wagmi'

**原因**：依赖未安装

**解决**：
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### 问题：WalletConnect连接失败

**原因**：项目ID未配置或错误

**解决**：
1. 访问 https://cloud.walletconnect.com
2. 创建项目并获取ID
3. 替换 `src/config/wagmi.js` 中的项目ID

### 问题：网络切换失败

**原因**：钱包未添加Sepolia网络

**解决**：
- 在MetaMask中手动添加Sepolia网络
- 或使用RainbowKit的网络切换功能

### 问题：交易失败

**检查清单**：
1. ✅ 钱包有足够的ETH余额
2. ✅ 在Sepolia测试网络
3. ✅ Gas费用设置合理
4. ✅ 合约地址正确

## 推荐的开发工作流

### 1. 先测试基础功能

- ✅ 页面能正常加载
- ✅ 钱包连接按钮显示
- ✅ RainbowKit弹窗能打开
- ✅ 选择钱包后能连接

### 2. 再测试合约交互

- ✅ 读取合约数据
- ✅ 发送交易
- ✅ 等待交易确认

### 3. 最后测试完整流程

- ✅ 浏览活动
- ✅ 选择座位
- ✅ 购票
- ✅ 查看门票

## 需要帮助？

如果以上方法都无法解决问题，请提供：
1. 完整的错误信息（截图或复制）
2. 浏览器控制台输出
3. package.json内容
4. 运行的npm命令

## 快速回退方案

如果Wagmi改造遇到太多问题，可以回退到原始的ethers.js版本：

1. 恢复 `src/main.jsx` 为原始版本
2. 恢复 `src/App.jsx` 为原始版本
3. 恢复 `src/components/Navbar.jsx` 为原始版本
4. 删除 `src/config/wagmi.js`
5. 删除Wagmi相关依赖（可选）

这样可以先保证网站正常运行，之后再逐步迁移。

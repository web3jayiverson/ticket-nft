# 快速修复指南 - Invalid Hook Call 错误

## 已完成的修复

✅ 修复了 `useWaitForTransactionReceipt` 在hash为null时的问题
✅ 简化了Home.jsx，移除复杂的合约调用逻辑
✅ 所有hooks现在都在组件顶层正确调用

## 立即执行的步骤

### 步骤1：清除缓存和重新安装

Windows PowerShell:
```powershell
cd C:/Users/Administrator/desktop/ticket

# 删除node_modules
Remove-Item -Recurse -Force node_modules

# 删除lock文件
Remove-Item package-lock.json

# 重新安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 步骤2：清除浏览器缓存

1. 按 `F12` 打开开发者工具
2. 右键点击浏览器刷新按钮
3. 选择"清空缓存并硬性重新加载"

或者使用快捷键：
- Windows: `Ctrl + Shift + Delete`
- Mac: `Cmd + Shift + Delete`

### 步骤3：检查依赖是否安装成功

```bash
npm list wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

应该看到这些包已安装。如果没有，运行：
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

## 如果问题仍然存在

### 选项A：临时回退到ethers.js

1. 恢复原始的main.jsx（删除Wagmi相关代码）
2. 恢复原始的App.jsx（使用ethers.js）
3. 恢复原始的Navbar.jsx
4. 删除 `src/config/wagmi.js`

这样可以立即恢复网站功能。

### 选项B：检查具体的hooks问题

打开浏览器控制台（F12），查看完整的错误信息，包括：
- 错误堆栈
- 哪个组件导致的问题
- 具体的hooks调用位置

## 验证修复是否成功

修复成功后，你应该能看到：
1. ✅ 页面正常加载，没有错误
2. ✅ "连接钱包"按钮显示
3. ✅ 点击按钮弹出RainbowKit钱包选择界面
4. ✅ 可以选择不同的钱包（MetaMask、WalletConnect等）

## 已知问题和解决方案

### 问题1：useWaitForTransactionReceipt错误
**状态**: ✅ 已修复
**方法**: 添加了 `enabled: !!hash` 条件

### 问题2：Home.jsx合约读取复杂
**状态**: ✅ 已修复
**方法**: 暂时使用本地数据，简化逻辑

### 问题3：依赖未安装
**状态**: ⚠️ 需要手动安装
**方法**: 运行 `npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query`

## 获取帮助

如果以上步骤都无法解决问题：

1. **复制完整的错误信息**包括堆栈跟踪
2. **提供浏览器控制台输出**
3. **说明你运行的命令**

这样可以更快定位和解决问题。

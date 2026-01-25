# Windows 测试脚本使用指南

## 📁 文件说明

### 1. run-tests.bat
- **类型**: Windows 批处理脚本
- **兼容**: 所有 Windows 版本
- **运行方式**: 双击运行或命令行执行

### 2. run-tests.ps1
- **类型**: PowerShell 脚本
- **兼容**: Windows 7/8/10/11
- **运行方式**: 右键 → "使用 PowerShell 运行"

---

## 🚀 快速开始

### 方法 1: 双击运行（推荐）

1. 打开文件资源管理器
2. 进入 `scripts` 文件夹
3. **双击 `run-tests.bat`**
4. 等待测试完成
5. 查看结果和推荐

### 方法 2: 使用 PowerShell（更现代）

1. 右键点击 `run-tests.ps1`
2. 选择"使用 PowerShell 运行"
3. 等待测试完成
4. 查看彩色结果输出

### 方法 3: 命令行运行

#### CMD (批处理)
```cmd
cd C:\Users\Administrator\Desktop\ticket\scripts
run-tests.bat
```

#### PowerShell
```powershell
cd C:\Users\Administrator\Desktop\ticket\scripts
.\run-tests.ps1
```

---

## 📊 测试内容

### 自动检查项目

✅ Node.js 安装
✅ 项目结构验证
✅ 依赖安装状态
✅ ESLint 代码检查
✅ 构建测试
✅ 测试配置检查

### 手动审计项目

#### 1. 查看 AUDIT_CHECKLIST.md
```
位置: C:\Users\Administrator\Desktop\ticket\AUDIT_CHECKLIST.md

用途:
- 逐项检查智能合约安全性
- 检查前端安全点
- 验证访问控制
```

#### 2. 查看 BOUNDARY_TESTING.md
```
位置: C:\Users\Administrator\Desktop\ticket\docs\BOUNDARY_TESTING.md

用途:
- 边界值测试用例
- 压力测试场景
- 异常情况处理
```

#### 3. 查看 GO_LIVE_CHECKLIST.md
```
位置: C:\Users\Administrator\Desktop\ticket\GO_LIVE_CHECKLIST.md

用途:
- 3周上线计划
- 应急预案
- 监控指标
```

---

## 🛠️ 高级安全工具安装

### 1. Slither (静态分析)

#### 安装 Python (如果未安装)
1. 下载 Python: https://www.python.org/downloads/
2. 安装时勾选 "Add Python to PATH"

#### 安装 Slither
```cmd
pip install slither-analyzer
```

#### 运行 Slither
```cmd
cd C:\Users\Administrator\Desktop\ticket
slither TicketNFT_Fixed.sol --filter reentrancy-eth,uninitialized-state
```

### 2. MythX (商业审计)

1. 访问 https://mythx.io/
2. 注册账号
3. 上传合约文件
4. 查看分析报告

### 3. CertiK (专业审计)

1. 访问 https://www.certik.com/
2. 提交审计申请
3. 费用: $5K-$50K
4. 等待 1-2 周

### 4. Foundry (测试框架)

#### 安装
```powershell
# 方法 1: 使用安装脚本（推荐）
irm https://foundry.paradigm.xyz | iex

# 方法 2: 手动下载
# 访问 https://book.getfoundry.sh/
```

#### 运行测试
```cmd
cd C:\Users\Administrator\Desktop\ticket
forge test
forge coverage
```

---

## 📋 测试检查清单

### 运行自动化测试后

- [ ] run-tests.bat 或 run-tests.ps1 成功执行
- [ ] Node.js 版本 ≥ 18.0.0
- [ ] 依赖安装成功
- [ ] ESLint 检查通过
- [ ] 构建成功
- [ ] 无严重错误

### 手动审计

- [ ] 阅读并检查 AUDIT_CHECKLIST.md 所有项
- [ ] 阅读 BOUNDARY_TESTING.md 并执行关键测试
- [ ] 阅读 GO_LIVE_CHECKLIST.md 并准备上线计划
- [ ] 记录所有发现的问题

### 工具安装

- [ ] 安装 Slither（静态分析）
- [ ] 安装 Foundry（测试框架）
- [ ] 配置 MythX 或 CertiK 账户
- [ ] 运行至少一次完整审计

---

## 🚨 常见问题

### Q1: 运行脚本时提示 "npm 不是内部或外部命令"

**原因**: Node.js 未安装或未添加到 PATH

**解决**:
1. 下载并安装 Node.js: https://nodejs.org/
2. 重启命令行
3. 重新运行测试脚本

### Q2: ESLint 检查失败

**原因**: 代码存在 lint 错误

**解决**:
```cmd
# 查看详细错误
npm run lint

# 自动修复
npm run lint -- --fix
```

### Q3: 构建失败

**原因**: 代码有编译错误

**解决**:
1. 查看详细错误信息
2. 修复报错的问题
3. 重新运行测试

### Q4: PowerShell 提示 "无法运行脚本"

**原因**: PowerShell 执行策略限制

**解决**:
```powershell
# 临时允许（不推荐）
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或右键选择"使用 PowerShell 运行"
```

### Q5: 找不到 package.json

**原因**: 不在正确的目录

**解决**:
```cmd
cd C:\Users\Administrator\Desktop\ticket
dir package.json
```

---

## 📊 测试结果解读

### ✅ 成功标志

- `[√]` - 检查通过
- `[OK]` - 无错误
- 绿色文本 - 正常状态

### ⚠️ 警告标志

- `[⚠]` - 发现警告
- `[信息]` - 信息提示
- 黄色文本 - 需要注意

### ❌ 错误标志

- `[错误]` - 检查失败
- `[失败]` - 操作失败
- 红色文本 - 需要修复

---

## 📞 需要帮助？

### 测试相关问题
1. 检查 Node.js 是否安装: `node --version`
2. 检查 npm 是否可用: `npm --version`
3. 检查文件是否在正确位置

### 审计问题
1. 查看 AUDIT_CHECKLIST.md 的详细说明
2. 访问 https://docs.openzeppelin.com/contracts-upgrades/security
3. 咨询专业审计公司

### 工具安装问题
1. 查看 GitHub 文档
2. 搜索错误信息
3. 提交 Issue

---

## 🚀 下一步

### 1. 完成自动化测试
```cmd
cd C:\Users\Administrator\Desktop\ticket\scripts
run-tests.bat
```

### 2. 执行手动审计
- 打开 `AUDIT_CHECKLIST.md`
- 逐项检查并记录结果
- 修复所有高/中危问题

### 3. 边界测试
- 打开 `BOUNDARY_TESTING.md`
- 执行关键测试用例
- 记录 Bug 和改进

### 4. 准备上线
- 打开 `GO_LIVE_CHECKLIST.md`
- 按照 3 周计划执行
- 完成所有检查项

### 5. 专业审计
- 提交到 CertiK
- 或使用 OpenZeppelin 审计
- 根据审计结果修复

---

## 📚 参考资料

### 安全资源
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts-upgrades/security)
- [ConsenSys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity by Example - Security](https://solidity-by-example.org/hacks/)
- [Ethereum Smart Contract Security](https://ethereum.org/en/developers/docs/smart-contracts/security/)

### 审计公司
- [CertiK](https://www.certik.com/) - $5K-$50K, 1-2周
- [OpenZeppelin](https://www.openzeppelin.com/audits/) - $15K-$100K, 2-4周
- [ConsenSys Diligence](https://consensys.net/diligence/) - $30K-$200K, 3-6周

### Bug Bounty
- [Immunefi](https://immunefi.com/)
- [HackerOne](https://www.hackerone.com/)
- [Bugcrowd](https://www.bugcrowd.com/)

---

**祝审计顺利！** 🛡️

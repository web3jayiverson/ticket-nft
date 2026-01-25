# 票务系统安全审计检查清单

## 📌 上线前必查项

### 1. 智能合约审计

- [ ] 使用 **Solidity 0.8.0+** 编译器（防止整数溢出）
- [ ] 所有 `public`/`external` 函数都有访问控制
- [ ] 使用 **OpenZeppelin** 审计过的库
- [ ] 添加 `ReentrancyGuard` 防止重入攻击
- [ ] 所有 `payable` 函数都检查 `msg.value`
- [ ] 关键操作使用 **Checks-Effects-Interactions** 模式
- [ ] 循环有 Gas 限制或提前退出条件
- [ ] 事件日志完整，便于追踪

### 2. 访问控制

- [ ] `createEvent` 只有 owner 可调用 ✅
- [ ] `verifyTicket` 只有 owner 可调用 ✅
- [ ] `refundTickets` 只有 owner 可调用 ✅
- [ ] `buyTicket` 任何人都可以调用（正确）
- [ ] 无法绕过 `onlyOwner` 检查

### 3. 边界条件测试

- [ ] 余额为 0 时购买票 → 应失败
- [ ] 支付金额不足 → 应失败 ✅
- [ ] 支付金额过多 → 应成功
- [ ] 购买同一座位两次 → 第二次失败 ✅
- [ ] 活动售完后购买 → 应失败
- [ ] 购买不存在的活动 → 应失败
- [ ] 核销不存在的票 → 应失败
- [ ] 核销已核销的票 → 应失败
- [ ] 活动已取消后购买 → 应失败

### 4. 经济安全

- [ ] 不会丢失用户资金
- [ ] 多付的 ETH 会返还或记录
- [ ] Gas 费用合理
- [ ] 没有隐藏费用
- [ ] 合约不会卡住（可退押金）

### 5. 前端安全

- [ ] 用户输入都经过验证
- [ ] 没有 XSS 漏洞
- [ ] 钱包签名在本地完成
- [ ] 私钥永远不会暴露
- [ ] 敏感操作需要用户确认
- [ ] 错误信息不泄露内部状态

### 6. 逻辑漏洞

- [ ] 不能重复购买同一座位
- [ ] 不能购买已售完的活动
- [ ] 不能取消他人的票
- [ ] 转售逻辑正确（如果支持）
- [ ] Token ID 唯一且可追踪

## 🧪 测试工具推荐

### 静态分析工具

```bash
# Slither - 免费，快速
slither . --filter reentrancy-eth,uninitialized-state

# Mythril - 免费，深度分析
myth analyze TicketNFT_Fixed.sol

# Manticore - 符号执行
manticore TicketNFT_Fixed.sol
```

### 形式化验证

```bash
# Certora Prover - 商业级
# K Framework - 学术研究
# Why3 - SMT 求解器
```

### 商业审计公司

| 公司 | 费用 | 时间 | 链接 |
|-----|------|------|------|
| **CertiK** | $5K-$50K | 1-2周 | certik.com |
| **OpenZeppelin** | $15K-$100K | 2-4周 | openzeppelin.com |
| **ConsenSys Diligence** | $30K-$200K | 3-6周 | consensys.net |
| **Trail of Bits** | $20K-$100K | 2-4周 | trailofbits.com |
| **SlowMist** | $10K-$50K | 2-3周 | slowmist.com |

### 测试网测试

```bash
# 1. 部署到测试网
forge script script/Deploy.s.t.sol --rpc-url $SEPOLIA_RPC --broadcast

# 2. 手动测试关键功能
# - 创建活动
# - 购买票
# - 核销票
# - 取消活动

# 3. 测试极端情况
# - 多用户并发购买
# - 网络/节点故障恢复
# - 跨链/错误网络操作
```

## 🚨 发现问题后的处理

### 高危问题
- 立即暂停合约
- 通知所有用户
- 准备迁移计划
- 修复并重新审计

### 中危问题
- 记录问题
- 评估风险
- 在下次更新中修复
- 增加监控

### 低危问题
- 记录到技术债务
- 在合适时机修复
- 增加文档

## 📊 上线后监控

### 链上监控

```javascript
// 监控异常事件
const suspiciousPatterns = [
  'singleUserBuyingAllTickets',
  'multipleUsersBuyingSameSeat',
  'ownerSellingAll',
  'priceManipulation'
];

// 设置告警
if (patternMatched) {
  alert('检测到异常交易！');
  pauseContract();
}
```

### 前端监控

```javascript
// 错误日志
window.addEventListener('error', (e) => {
  logErrorToServer(e);
});

// 交易失败监控
trackTransactionErrors();

// Gas 使用监控
trackGasUsage();
```

### 事件监控

```solidity
event EmergencyAlert(address indexed user, string reason);

function emergencyPause() external onlyOwner {
    emit EmergencyAlert(msg.sender, "Contract paused");
    _pause();
}
```

## ✅ 上线前最终检查

- [ ] 所有测试通过（单元测试 + 集成测试）
- [ ] 至少 2 次独立审计通过
- [ ] 测试网运行 ≥ 1 周
- [ ] Bug bounty 计划启动
- [ ] 监控系统就绪
- [ ] 应急预案准备好
- [ ] 保险/担保方案确认
- [ ] 法律合规检查完成
- [ ] 用户文档完整
- [ ] 团队培训完成

## 📞 应急预案

### 如果发现严重漏洞

1. **立即行动**
   - 暂停合约
   - 通知社区
   - 评估损失

2. **修复策略**
   - 准备修复补丁
   - 代码审计
   - 部署新合约

3. **迁移计划**
   - 数据迁移脚本
   - 用户指引
   - 时间表公开

4. **事后分析**
   - 根因分析
   - 改进流程
   - 发布报告

## 📚 参考资料

- [OpenZeppelin Security Best Practices](https://docs.openzeppelin.com/contracts-upgrades/1.X.x/writing-upgradeable-contracts#security-best-practices)
- [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity by Example - Security](https://solidity-by-example.org/hacks/)
- [Ethereum Smart Contract Security](https://ethereum.org/en/developers/docs/smart-contracts/security/)

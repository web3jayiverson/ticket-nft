# 前端边界测试用例

## 🎯 测试场景分类

### 1. 输入边界测试

#### 活动名称
- [ ] 空字符串 → 应拒绝
- [ ] 只有空格 → 应拒绝
- [ ] 超长字符串（>200字符）→ 应拒绝或截断
- [ ] 特殊字符（`<script>alert(1)</script>`）→ 应转义或拒绝
- [ ] Emoji 表情 → 应正常处理
- [ ] 多行文本 → 应正常处理
- [ ] SQL 注入尝试 → 应转义或拒绝

#### 票价输入
- [ ] 0 或负数 → 应拒绝
- [ ] 极小值（0.00000001 ETH）→ 应接受或拒绝
- [ ] 极大值（10000 ETH）→ 应警告或拒绝
- [ ] 非数字输入 → 应拒绝
- [ ] 科学计数法（1e18）→ 应正确处理

#### 日期时间
- [ ] 过去时间 → 应拒绝
- [ ] 极近未来（1分钟后）→ 应警告
- [ ] 极远未来（100年后）→ 应限制
- [ ] 无效日期格式 → 应拒绝
- [ ] 时区问题 → 应正确显示

### 2. 网络边界测试

#### 连接状态
- [ ] 断网时点击购买 → 应提示重新连接
- [ ] 网络恢复后自动重连 → 应正常
- [ ] 切换网络 → 应提示切换到正确网络
- [ ] MetaMask 锁定时操作 → 应提示解锁

#### 节点故障
- [ ] RPC 节点超时 → 应重试或切换节点
- [ ] 节点返回错误 → 应优雅降级
- [ ] 多次失败后显示错误 → 不无限重试

### 3. 钱包交互边界

#### 余额检查
- [ ] 余额为 0 → 禁用购买按钮
- [ ] 余额刚好够购买 → 允许
- [ ] 余额不足以支付 Gas → 警告

#### 交易状态
- [ ] 用户取消交易 → 应恢复状态
- [ ] 交易失败（Gas不足）→ 显示详细错误
- [ ] 交易卡住（Pending）→ 显示等待提示
- [ ] 交易确认 → 正常处理
- [ ] 交易回滚 → 显示原因

#### 并发场景
- [ ] 快速连续点击购买 → 防止重复提交
- [ ] 同时打开多个购买窗口 → 应检测冲突
- [ ] 交易确认前切换页面 → 应保持状态

### 4. 数据边界测试

#### localStorage
- [ ] localStorage 已满 → 优雅降级
- [ ] localStorage 被禁用 → 提示并限制功能
- [ ] 数据损坏 → 检测并重建
- [ ] 大量数据存储 → 限制大小或提示

#### 浏览器兼容性
- [ ] Chrome 最新版 → 完全支持
- [ ] Firefox 最新版 → 完全支持
- [ ] Safari 最新版 → 完全支持
- [ ] 移动浏览器 → 响应式布局
- [ ] 不支持的浏览器 → 降级体验

### 5. 边界值测试

#### 活动数量
- [ ] 0 个活动 → 显示空状态
- [ ] 1 个活动 → 正常显示
- [ ] 100 个活动 → 性能测试
- [ ] 1000 个活动 → 应分页或虚拟滚动

#### 票务数量
- [ ] 0 张票 → 显示空状态
- [ ] 1 张票 → 正常显示
- [ ] 100 张票 → 性能测试
- [ ] 1000 张票 → 应分页

#### 座位图
- [ ] 1x1 座位图 → 正常显示
- [ ] 100x100 座位图 → 性能测试
- [ ] 全部售完 → 正确显示
- [ ] 全部可选 → 正确显示

### 6. 性能边界测试

#### 加载时间
- [ ] 首次加载 < 3秒
- [ ] 页面切换 < 1秒
- [ ] 查询交易 < 5秒
- [ ] 渲染 1000 张票 < 1秒

#### 内存使用
- [ ] 长时间使用无内存泄漏
- [ ] 切换页面释放内存
- [ ] 大量数据不卡顿

### 7. 安全边界测试

#### XSS 攻击
```javascript
// 测试用例
const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>'
];

xssPayloads.forEach(payload => {
  // 在活动名称、描述等字段测试
  // 应该转义或拒绝
});
```

#### CSRF 攻击
- [ ] 所有修改操作需要签名
- [ ] 验证交易来源
- [ ] 不执行未授权操作

#### 点击劫持
- [ ] 使用 `frame-ancestors` 检测
- [ ] 设置 `X-Frame-Options` 头

#### Cookie 安全
- [ ] 敏感 Cookie 使用 `HttpOnly`
- [ ] 设置 `Secure` 标志
- [ ] 使用 `SameSite` 属性

### 8. 用户体验边界

#### 错误提示
- [ ] 所有错误都有友好提示
- [ ] 技术错误转换为用户可读
- [ ] 提供解决建议

#### 加载状态
- [ ] 长时间操作显示进度
- [ ] 可取消长时间操作
- [ ] 操作完成后反馈

#### 键盘/无障碍
- [ ] 支持键盘导航
- [ ] 支持屏幕阅读器
- [ ] 遵循 WCAG 标准

## 🧪 自动化测试

### Cypress E2E 测试示例

```javascript
describe('Boundary Tests', () => {
  // 测试余额为 0
  it('should disable purchase when balance is 0', () => {
    cy.visit('/');
    cy.connectWalletWithBalance(0);
    cy.contains('购票').click();
    cy.contains('余额不足').should('be.visible');
  });

  // 测试网络切换
  it('should warn when on wrong network', () => {
    cy.visit('/');
    cy.connectWalletOnNetwork(1); // Mainnet
    cy.contains('切换到 Sepolia').should('be.visible');
  });

  // 测试取消交易
  it('should handle transaction rejection', () => {
    cy.visit('/');
    cy.connectWallet();
    cy.selectFirstEvent();
    cy.selectSeat(1, 1);
    cy.contains('购买').click();
    cy.rejectMetaMaskTransaction();
    cy.contains('用户取消了交易').should('be.visible');
  });

  // 测试快速连续点击
  it('should prevent double submission', () => {
    cy.visit('/');
    cy.connectWallet();
    cy.selectFirstEvent();
    cy.selectSeat(1, 1);
    cy.contains('购买').click();
    cy.contains('购买').click(); // 快速再次点击
    cy.get('.loading').should('have.length', 1); // 只有一个加载中
  });
});
```

### Jest 单元测试

```javascript
describe('Input Validation', () => {
  test('should reject empty event name', () => {
    const result = validateEventName('');
    expect(result.isValid).toBe(false);
  });

  test('should reject XSS in event name', () => {
    const xss = '<script>alert(1)</script>';
    const result = validateEventName(xss);
    expect(result.sanitized).not.toContain('<script>');
  });

  test('should reject negative price', () => {
    const result = validatePrice(-0.1);
    expect(result.isValid).toBe(false);
  });

  test('should reject past date', () => {
    const pastDate = new Date(2000, 0, 1);
    const result = validateEventDate(pastDate);
    expect(result.isValid).toBe(false);
  });
});
```

## 📊 测试覆盖率目标

- [ ] 代码覆盖率 ≥ 80%
- [ ] 关键路径覆盖率 100%
- [ ] 边界条件覆盖率 ≥ 90%
- [ ] 错误处理覆盖率 100%

## 🚨 常见 Bug 模式

1. **未定义错误**：检查所有变量初始化
2. **类型错误**：严格类型检查
3. **异步错误**：正确处理 Promise
4. **竞态条件**：使用锁或队列
5. **资源泄漏**：及时清理和释放

## ✅ 测试完成检查

- [ ] 所有测试用例通过
- [ ] 覆盖率达标
- [ ] 手动测试关键流程
- [ ] 浏览器兼容性测试
- [ ] 移动端测试
- [ ] 性能测试通过
- [ ] 安全扫描通过
- [ ] 文档完整

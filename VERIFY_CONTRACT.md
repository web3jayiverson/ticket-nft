# 验证合约版本

## 🔍 步骤1：在 Etherscan 查看合约代码

1. 访问：https://sepolia.etherscan.io/address/0x98c6af4c16F492ECD21206f17Ace979CcF021f98#code

2. 找到 `buyTicket` 函数

3. 检查以下代码：

### ❌ 旧合约（有 Bug）：
```solidity
function buyTicket(...) external payable {
    // ...
    uint256 tokenId = _tokenIdCounter.current();  // ❌ 使用递增计数器
    _safeMint(msg.sender, tokenId);
    
    seatInfos[eventId][tokenIdFromSeat(...)] = SeatInfo({  // ❌ 键不一致
        // ...
    });
}
```

### ✅ 新合约（已修复）：
```solidity
function buyTicket(...) external payable {
    // ...
    uint256 tokenId = tokenIdFromSeat(eventId, row, seat);  // ✅ 使用座位编码
    _safeMint(msg.sender, tokenId);
    
    seatInfos[tokenId] = SeatInfo({  // ✅ 直接使用 tokenId
        // ...
    });
}
```

## 📋 步骤2：检查关键差异

### 旧合约的特征：
- ✅ 有 `Counters.Counter private _tokenIdCounter`
- ❌ 使用 `_tokenIdCounter.current()` 生成 tokenId
- ❌ 使用 `mapping(uint256 => mapping(uint256 => SeatInfo)) public seatInfos`（嵌套映射）
- ❌ 在 `getTicketInfo` 中从 `seatInfos[eventId][...]` 查询

### 新合约的特征：
- ✅ 有 `Counters.Counter private _eventIdCounter`（注意是 eventIdCounter！）
- ✅ 使用 `tokenIdFromSeat(eventId, row, seat)` 生成 tokenId
- ✅ 使用 `mapping(uint256 => SeatInfo) public seatInfos`（单一映射）
- ✅ 在 `getTicketInfo` 中从 `seatInfos[tokenId]` 查询

## ⚠️ 如果合约是旧版本

### 方案1：重新部署

1. **在 Remix 中：**
   - 打开 TicketNFT_Fixed.sol
   - 确认编译通过
   - 点击 Deploy

2. **在 MetaMask 中：**
   - 确认交易
   - 等待部署完成

3. **记录新地址：**
   - 复制 Remix 中显示的新合约地址
   - 这个地址会与 0x98c6af4c16F492ECD21206f17Ace979CcF021f98 不同

4. **更新 config.js：**
   ```javascript
   export const CONTRACT_ADDRESS = '新的合约地址';
   ```

### 方案2：验证 Remix 中的代码

如果 Remix 中的代码是正确的，但 Etherscan 上显示的是旧代码：

1. **检查 Remix 的文件：**
   - 确认打开的是 TicketNFT_Fixed.sol
   - 检查 buyTicket 函数是否使用 `tokenIdFromSeat`

2. **重新编译：**
   - 点击 Compile TicketNFT.sol
   - 确认编译成功（绿色 ✓）

3. **重新部署：**
   - 点击 Deploy
   - 确认 MetaMask 中的合约地址是新地址

## 🔧 临时解决方案（如果无法立即重新部署）

修改 MyTickets.jsx，增加更多调试：

```javascript
console.log('检查 getTicketInfo 方法是否可调用...');
try {
  const testInfo = await contract.getTicketInfo(1);
  console.log('✅ getTicketInfo(1) 成功:', testInfo);
} catch (e) {
  console.error('❌ getTicketInfo(1) 失败:', e);
  console.error('   错误原因:', e.message);
}

console.log('检查 balanceOf 方法是否可调用...');
try {
  const balance = await contract.balanceOf(account);
  console.log('✅ balanceOf 成功:', balance.toString());
} catch (e) {
  console.error('❌ balanceOf 失败:', e);
  console.error('   错误原因:', e.message);
}

console.log('检查 tokenOfOwnerByIndex 方法是否可调用...');
try {
  const tokenId = await contract.tokenOfOwnerByIndex(account, 0);
  console.log('✅ tokenOfOwnerByIndex 成功:', tokenId.toString());
} catch (e) {
  console.error('❌ tokenOfOwnerByIndex 失败:', e);
  console.error('   错误原因:', e.message);
}
```

## 🎯 快速验证清单

请回答以下问题：

1. [ ] Etherscan 上的 buyTicket 函数是否使用 `tokenIdFromSeat` ？
2. [ ] seatInfos 是单一映射还是嵌套映射？
3. [ ] Remix 中部署的合约地址是否与 config.js 一致？
4. [ ] 部署时是否有任何警告或错误？
5. [ ] 是否部署了多次，导致地址混淆？

## 📞 如果所有验证都通过但仍无法显示门票

请提供以下信息：

1. Etherscan 上的合约代码截图（buyTicket 函数部分）
2. Remix 部署成功后的合约地址
3. 控制台完整日志（从"开始加载门票"到"加载完成"）
4. 购买门票的交易哈希（可从 Etherscan 查询）

---

**请先验证合约版本，然后告诉我结果！**

# 使用 Remix 部署 TicketNFT 合约

## 🚀 第一步：打开 Remix IDE

1. 打开浏览器，访问：https://remix.ethereum.org/
2. 等待页面加载完成（可能需要几秒钟）

## 📝 第二步：创建新合约文件

1. 在左侧 **File Explorers** 面板中
2. 找到 `contracts` 文件夹
3. 右键点击 `contracts` → **Create New File**
4. 输入文件名：`TicketNFT.sol`
5. 点击 **OK**

## 📋 第三步：复制合约代码

1. 打开刚才创建的 `TicketNFT.sol` 文件
2. 复制下面的完整合约代码，粘贴到文件中：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TicketNFT - 修复版票务NFT合约
 * @dev 修复了 buyTicket 函数中 tokenId 生成逻辑的bug
 */
contract TicketNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    constructor() ERC721("EventTicket", "TKT") Ownable(msg.sender) {}
    
    // 活动ID计数器（用于生成唯一的eventId）
    Counters.Counter private _eventIdCounter;
    
    // 活动信息
    struct Event {
        string name;              // 活动名称
        string venue;             // 场地
        uint256 eventTime;        // 活动时间
        uint256 ticketPrice;      // 门票价格（wei）
        uint256 maxTickets;       // 最大票数
        uint256 soldTickets;      // 已售票数
        bool isActive;            // 是否激活
    }
    
    // 座位信息
    struct SeatInfo {
        string section;           // 区域
        uint256 row;              // 排号
        uint256 seat;             // 座号
        bool isValid;             // 是否有效
        bool isVerified;          // 是否已核销
        address owner;            // 持有者
    }
    
    // 转售规则
    struct ResaleRule {
        bool allowResale;         // 是否允许转售
        uint256 maxResalePrice;   // 最高转售价
        uint256 resaleDeadline;   // 转售截止时间
    }
    
    // 数据存储
    mapping(uint256 => Event) public events;
    mapping(uint256 => SeatInfo) public seatInfos;  // 修复：直接使用 tokenId 作为键
    mapping(uint256 => ResaleRule) public resaleRules;
    
    // 事件
    event EventCreated(uint256 indexed eventId, string name, uint256 eventTime);
    event TicketPurchased(uint256 indexed tokenId, uint256 eventId, address buyer);
    event TicketVerified(uint256 indexed tokenId, address verifier);
    
    // 创建活动
    function createEvent(
        string memory name,
        string memory venue,
        uint256 eventTime,
        uint256 ticketPrice,
        uint256 maxTickets,
        bool allowResale,
        uint256 maxResalePrice,
        uint256 resaleDeadline
    ) external onlyOwner {
        uint256 eventId = _eventIdCounter.current();
        
        events[eventId] = Event({
            name: name,
            venue: venue,
            eventTime: eventTime,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            soldTickets: 0,
            isActive: true
        });
        
        resaleRules[eventId] = ResaleRule({
            allowResale: allowResale,
            maxResalePrice: maxResalePrice,
            resaleDeadline: resaleDeadline
        });
        
        _eventIdCounter.increment();
        emit EventCreated(eventId, name, eventTime);
    }
    
    // 购买门票（已修复）
    function buyTicket(
        uint256 eventId,
        string memory section,
        uint256 row,
        uint256 seat,
        string memory _tokenURI
    ) external payable {
        Event storage eventInfo = events[eventId];
        require(eventInfo.isActive, "Event is not active");
        require(msg.value >= eventInfo.ticketPrice, "Insufficient payment");
        require(eventInfo.soldTickets < eventInfo.maxTickets, "Sold out");
        
        // 检查座位是否已被占用
        uint256 tokenId = tokenIdFromSeat(eventId, row, seat);
        require(!seatInfos[tokenId].isValid, "Seat already taken");
        
        // 修复：直接使用座位编码作为 tokenId 铸造 NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // 修复：使用相同的 tokenId 存储座位信息
        seatInfos[tokenId] = SeatInfo({
            section: section,
            row: row,
            seat: seat,
            isValid: true,
            isVerified: false,
            owner: msg.sender
        });
        
        eventInfo.soldTickets++;
        emit TicketPurchased(tokenId, eventId, msg.sender);
    }
    
    // 核销门票
    function verifyTicket(uint256 tokenId) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Ticket does not exist");
        
        // 从 tokenId 解析出 eventId 和座位信息
        SeatInfo storage seatInfo = seatInfos[tokenId];
        require(seatInfo.isValid, "Invalid ticket");
        require(!seatInfo.isVerified, "Already verified");
        
        seatInfo.isVerified = true;
        emit TicketVerified(tokenId, msg.sender);
    }
    
    // 查询票务信息
    function getTicketInfo(uint256 tokenId) external view returns (
        uint256 eventId,
        string memory eventName,
        string memory section,
        uint256 row,
        uint256 seat,
        bool isVerified,
        address owner
    ) {
        require(ownerOf(tokenId) != address(0), "Ticket does not exist");
        
        // 修复：直接从 tokenId 解析出所有信息
        SeatInfo storage seatInfo = seatInfos[tokenId];
        
        (eventId, row, seat) = getSeatFromToken(tokenId);
        
        return (
            eventId,
            events[eventId].name,
            seatInfo.section,
            row,
            seat,
            seatInfo.isVerified,
            ownerOf(tokenId)
        );
    }
    
    // 辅助函数：从tokenId解析座位
    function getSeatFromToken(uint256 tokenId) internal pure returns (uint256, uint256, uint256) {
        uint256 eventId = tokenId / 10000;
        uint256 row = (tokenId % 10000) / 100;
        uint256 seat = tokenId % 100;
        return (eventId, row, seat);
    }
    
    // 辅助函数：生成tokenId
    function tokenIdFromSeat(uint256 eventId, uint256 row, uint256 seat) internal pure returns (uint256) {
        return eventId * 10000 + row * 100 + seat;
    }
    
    // 检查门票是否有效
    function isTicketValid(uint256 tokenId) external view returns (bool) {
        if (ownerOf(tokenId) == address(0)) return false;
        
        SeatInfo storage seatInfo = seatInfos[tokenId];
        return seatInfo.isValid && !seatInfo.isVerified;
    }
    
    // 查询活动信息
    function getEventInfo(uint256 eventId) external view returns (
        string memory name,
        string memory venue,
        uint256 eventTime,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 soldTickets,
        bool isActive
    ) {
        Event storage eventInfo = events[eventId];
        return (
            eventInfo.name,
            eventInfo.venue,
            eventInfo.eventTime,
            eventInfo.ticketPrice,
            eventInfo.maxTickets,
            eventInfo.soldTickets,
            eventInfo.isActive
        );
    }
    
    // 退款（主办方可取消活动）
    function refundTickets(uint256 eventId) external onlyOwner {
        events[eventId].isActive = false;
    }
    
    // ERC721 标准函数覆盖
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }
}
```

## 🔨 第四步：编译合约

1. 在左侧面板点击 **Solidity Compiler** 图标（第二个图标，看起来像 < S >）
2. 在 **Compiler** 下拉菜单中选择：`0.8.19` 或 `0.8.20`
3. 点击 **Compile TicketNFT.sol** 按钮
4. 等待编译完成，如果成功会显示绿色的 ✓

**如果编译出错：**
- 确保选择了正确的编译器版本（0.8.19 或 0.8.20）
- 检查代码是否完整复制
- 查看 **Compile** 按钮下方的错误信息

## 🔗 第五步：连接 MetaMask

1. 在左侧面板点击 **Deploy & Run Transactions** 图标（第三个图标，看起来像 🚀）
2. 在 **Environment** 下拉菜单中选择：**Injected Provider - MetaMask**
3. MetaMask 会弹出授权窗口，点击 **下一步** → **连接**
4. 确保 MetaMask 已切换到 **Sepolia 测试网**
   - 打开 MetaMask
   - 点击网络名称下拉菜单
   - 选择 **Sepolia test network**

## 💰 第六步：准备 Sepolia ETH

如果您的账户没有 Sepolia 测试网 ETH：

1. 访问水龙头：https://sepoliafaucet.com/
2. 输入您的钱包地址
3. 点击 **Send Sepolia ETH**
4. 等待几分钟，ETH 会到账

**其他水龙头：**
- https://www.infura.io/faucet/sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

## 🚀 第七步：部署合约

1. 在 Remix 左侧面板（Deploy & Run Transactions）
2. 在 **CONTRACT** 下拉菜单中，确保选择的是：**TicketNFT**
3. 点击橙色的 **Deploy** 按钮
4. MetaMask 会弹出确认窗口，检查：
   - 网络是否为 Sepolia
   - Gas 费用是否合理（约 0.001-0.005 ETH）
   - 点击 **确认**
5. 等待交易确认（通常需要 10-30 秒）
6. 部署成功后，下方会显示：
   - **Deployed Contracts**
   - **TicketNFT at 0x...**（这就是合约地址！）

## 📋 第八步：记录合约地址

1. 找到 **Deployed Contracts** 部分的 **TicketNFT at 0x...**
2. 复制完整的合约地址（以 0x 开头，42个字符）
3. **保存这个地址！** 后面需要用到

**示例：**
```
合约地址: 0x1234567890abcdef1234567890abcdef12345678
```

## 📝 第九步：更新前端配置

1. 打开前端项目：`C:\Users\Administrator\Desktop\ticket`
2. 编辑文件：`src\config.js`
3. 找到这一行：
   ```javascript
   export const CONTRACT_ADDRESS = '0xE3736700066d59Aef74480D6ad77e8d3bd821A97';
   ```
4. 替换为新的合约地址：
   ```javascript
   export const CONTRACT_ADDRESS = '你复制的合约地址';
   ```
5. 保存文件

## 🧪 第十步：测试新合约

1. 启动前端项目：
   ```bash
   cd C:\Users\Administrator\Desktop\ticket
   npm run dev
   ```

2. 在浏览器中打开：http://localhost:5173

3. **测试步骤：**

   **步骤 1：创建活动**
   - 进入"管理员"页面
   - 创建活动A（例如："测试演唱会A"）
   - 创建活动B（例如："测试演唱会B"）
   - 创建活动C（例如："测试演唱会C"）
   - 每个活动创建后，记录下活动ID（控制台会显示）

   **步骤 2：购买门票**
   - 返回首页
   - 购买活动A的门票
   - 购买活动B的门票
   - 购买活动C的门票

   **步骤 3：验证修复**
   - 进入"我的门票"页面
   - 查看每张门票的活动名称
   - **✅ 应该与购买的活动一致！**
   - 不再出现"全部显示为活动0"的问题

## ✅ 验证成功的标志

如果修复成功，您应该看到：

```
我的门票页面：
门票 1 - 测试演唱会A  ✅
门票 2 - 测试演唱会B  ✅
门票 3 - 测试演唱会C  ✅
```

而不是之前的：
```
我的门票页面（错误）：
门票 1 - 测试演唱会A  ❌
门票 2 - 测试演唱会A  ❌  （应该是B）
门票 3 - 测试演唱会A  ❌  （应该是C）
```

## 🎯 快速对比测试

创建 3 个活动后，购买不同活动的门票，然后查看控制台输出：

| 购买的门票 | 修复前（错误） | 修复后（正确） |
|----------|--------------|--------------|
| 活动 ID=0 的票 | 显示活动0 ✅ | 显示活动0 ✅ |
| 活动 ID=3 的票 | 显示活动0 ❌ | 显示活动3 ✅ |
| 活动 ID=5 的票 | 显示活动0 ❌ | 显示活动5 ✅ |

## ⚠️ 常见问题

### 1. 编译错误
**问题：** 显示红色错误信息
**解决：**
- 确保编译器版本是 0.8.19 或 0.8.20
- 检查代码是否完整复制
- 刷新 Remix 页面重新编译

### 2. 部署失败
**问题：** MetaMask 提示失败或交易回滚
**解决：**
- 检查是否有足够的 Sepolia ETH
- 确认网络是 Sepolia 测试网
- 尝试提高 Gas 费用

### 3. 合约地址找不到
**问题：** 部署成功但看不到合约地址
**解决：**
- 展开 **Deployed Contracts** 部分
- 向下滚动查看
- 或者刷新 Remix 页面

### 4. 前端仍然显示旧数据
**问题：** 更新合约地址后仍然看到旧活动
**解决：**
- 确认 `src/config.js` 已保存
- 刷新浏览器页面
- 清除浏览器缓存（Ctrl + F5）

### 5. MetaMask 不弹出
**问题：** 点击部署没反应
**解决：**
- 刷新 Remix 页面
- 重新连接 MetaMask
- 检查 MetaMask 是否解锁

## 📊 部署成功检查清单

- [ ] Remix 编译成功（绿色 ✓）
- [ ] MetaMask 已连接到 Sepolia
- [ ] 账户有足够的 Sepolia ETH
- [ ] 合约部署成功
- [ ] 已复制并保存合约地址
- [ ] 已更新 `src/config.js`
- [ ] 前端重新启动
- [ ] 测试创建活动成功
- [ ] 测试购买门票成功
- [ ] 测试查询门票信息正确
- [ ] 不再出现"全部显示活动0"的Bug

## 🎉 恭喜！

如果您完成了以上所有步骤，并且测试通过，那么合约已经成功部署并修复了Bug！

现在您的票务系统可以正常工作了：
- ✅ 购买不同活动的门票会正确关联
- ✅ "我的门票"页面显示正确的活动信息
- ✅ 核销功能正常工作

祝您使用愉快！🚀

---

**如有问题，请检查：**
1. 合约部署是否成功
2. 前端 config.js 地址是否更新
3. MetaMask 是否连接到 Sepolia
4. 浏览器控制台是否有错误信息

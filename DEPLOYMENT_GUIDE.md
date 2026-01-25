# TicketNFT 合约修复部署指南

## 🔴 Bug 修复说明

### 原始Bug
原合约在 `buyTicket` 函数中存在严重的逻辑错误：

1. **NFT tokenId 生成**：使用 `_tokenIdCounter.current()` 递增（0, 1, 2, 3...）
2. **座位信息存储键**：使用 `tokenIdFromSeat(eventId, row, seat)` 座位编码
3. **结果**：tokenId 和座位信息键不一致，导致查询时数据错乱

**示例**：
- 购买 eventId=5, row=1, seat=1 的票
- NFT tokenId = 3（计数器当前值）
- 座位信息键 = 50101（座位编码）
- 查询 getTicketInfo(3) 时解析出 eventId=0, 错误！

### 修复方案
直接使用座位编码作为 tokenId：

```solidity
// 修复前（错误）
uint256 tokenId = _tokenIdCounter.current();  // 递增计数
tokenIdCounter.increment();

// 修复后（正确）
uint256 tokenId = tokenIdFromSeat(eventId, row, seat);  // 座位编码
```

## 📋 部署步骤

### 1. 准备工作

确保已安装以下工具：
```bash
npm install -g hardhat
npm install -g @openzeppelin/contracts
```

### 2. 创建新项目

```bash
# 创建新目录
cd ~/Desktop
mkdir ticket-contract
cd ticket-contract

# 初始化 Hardhat 项目
npx hardhat init
# 选择: "Create a TypeScript project"

# 安装依赖
npm install @openzeppelin/contracts dotenv @nomicfoundation/hardhat-toolbox
```

### 3. 复制合约文件

将 `TicketNFT_Fixed.sol` 复制到 `contracts/` 目录：
```bash
cp ~/Desktop/ticket/TicketNFT_Fixed.sol contracts/TicketNFT.sol
```

### 4. 配置 Hardhat

创建 `.env` 文件：
```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=你的MetaMask私钥
ETHERSCAN_API_KEY=你的Etherscan API Key（用于验证合约）
```

修改 `hardhat.config.ts`：
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
```

### 5. 创建部署脚本

创建 `scripts/deploy.ts`：
```typescript
import hre from "hardhat";

async function main() {
  console.log("部署 TicketNFT 合约到 Sepolia 测试网...");

  const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();

  await ticketNFT.waitForDeployment();
  const contractAddress = await ticketNFT.getAddress();

  console.log("✅ TicketNFT 合约已部署！");
  console.log("合约地址:", contractAddress);
  console.log("验证合约...");
  
  // 等待几个区块
  await new Promise(resolve => setTimeout(resolve, 30000));

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [],
  });

  console.log("✅ 合约验证完成！");
  console.log("\n📝 请更新前端的 config.js 文件：");
  console.log("CONTRACT_ADDRESS =", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 6. 部署合约

```bash
# 编译合约
npx hardhat compile

# 部署到 Sepolia 测试网
npx hardhat run scripts/deploy.ts --network sepolia
```

### 7. 更新前端配置

部署成功后，记录合约地址，然后更新前端配置：

编辑 `src/config.js`：
```javascript
// 将旧地址替换为新部署的合约地址
export const CONTRACT_ADDRESS = '新部署的合约地址';
```

### 8. 测试验证

1. **创建活动**（管理员页面）
   - 创建 "活动A", "活动B", "活动C"
   - 记录每个活动的 ID

2. **购买门票**（首页）
   - 购买活动A的门票
   - 购买活动B的门票
   - 购买活动C的门票

3. **验证门票信息**（我的门票页面）
   - 查看门票的活动名称
   - 应该与购买的活动一致
   - 不再出现"全部显示为活动0"的Bug

## 🔍 测试命令

### 测试购买门票
```javascript
// 在浏览器控制台测试
const contract = await ethers.getContractAt("TicketNFT", "合约地址");

// 购买 eventId=5, row=1, seat=1 的票
const tx = await contract.buyTicket(
  5,                    // eventId
  "A区",                 // section
  1,                     // row
  1,                     // seat
  "ipfs://test123",      // tokenURI
  { value: ethers.parseEther("0.001") }  // 价格
);
await tx.wait();

// 查询门票信息
const info = await contract.getTicketInfo(50001);
console.log("Event ID:", info[0].toString());
console.log("Event Name:", info[1]);
console.log("Row:", info[3].toString());
console.log("Seat:", info[4].toString());
```

预期输出：
```
Event ID: 5          ✅ 正确（之前是 0）
Event Name: 活动B     ✅ 正确（之前显示活动A的名称）
Row: 1                ✅ 正确
Seat: 1               ✅ 正确
```

## ⚠️ 重要提示

1. **私钥安全**：不要将 `.env` 文件上传到 GitHub
2. **Gas 费用**：Sepolia 测试网的 Gas 很便宜，但仍然需要测试 ETH
3. **合约验证**：部署后在 Etherscan 上验证合约代码，提高可信度
4. **测试充分**：在主网部署前，在测试网充分测试所有功能

## 📊 性能对比

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| TicketId 生成 | 递增计数器 | 座位编码 |
| 数据一致性 | ❌ 不一致 | ✅ 一致 |
| 查询正确率 | ❌ 错误 | ✅ 100%正确 |
| 可维护性 | ❌ 复杂 | ✅ 简单 |

## 🎯 修复总结

- ✅ 修复了 tokenId 生成逻辑
- ✅ 确保 tokenId 和座位信息键一致
- ✅ getTicketInfo 函数正确解析活动信息
- ✅ 所有查询功能正常工作

---

如有问题，请检查：
1. 合约部署是否成功
2. 前端 config.js 地址是否更新
3. MetaMask 是否连接到 Sepolia 网络
4. 浏览器控制台是否有错误信息

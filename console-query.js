// 复制这些命令到浏览器控制台运行

const CONTRACT_ADDRESS = '0x98c6af4c16F492ECD21206f17Ace979CcF021f98';
const CONTRACT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getTicketInfo(uint256 tokenId) external view returns (uint256 eventId, string eventName, string section, uint256 row, uint256 seat, bool isVerified, address owner)"
];

const userAddress = '0x5a4ba50900ad88886e65dd8927f8eca3c86ec06d';

// 加载 ethers
(async () => {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
  script.onload = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log('========== 开始查询 ==========');
    
    // 查询余额
    const balance = await contract.balanceOf(userAddress);
    console.log('余额:', balance.toString());
    
    const foundTokens = [];
    
    // 查询活动 0-5，每个活动前 200 个 token
    for (let eventId = 0; eventId <= 5; eventId++) {
      const startTokenId = eventId * 10000 + 1;
      const endTokenId = startTokenId + 199;
      
      console.log(`\n查询活动 ${eventId}: ${startTokenId}-${endTokenId}`);
      
      for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId++) {
        try {
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`✅ 找到 token: ${tokenId}`);
            foundTokens.push(tokenId);
            
            // 获取详细信息
            const info = await contract.getTicketInfo(tokenId);
            console.log(`  ${info.eventName} - ${info.section}区 ${info.row}行${info.seat}座`);
          }
        } catch (error) {
          // token 不存在，跳过
        }
      }
      
      if (foundTokens.length >= Number(balance)) {
        console.log('\n已找到所有门票！');
        break;
      }
    }
    
    console.log('\n========== 结果 ==========');
    console.log(`找到 ${foundTokens.length} 个 token:`, foundTokens);
  };
  document.head.appendChild(script);
})();

// 最终版快速查询
const CONTRACT_ADDRESS = '0x98c6af4c16F492ECD21206f17Ace979CcF021f98';
const CONTRACT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getTicketInfo(uint256 tokenId) external view returns (uint256 eventId, string eventName, string section, uint256 row, uint256 seat, bool isVerified, address owner)"
];

const userAddress = '0x5a4ba50900ad88886e65dd8927f8eca3c86ec06d';

(async () => {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
  script.onload = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log('========== 快速查询开始 ==========');
    
    const balance = await contract.balanceOf(userAddress);
    console.log('余额:', balance.toString(), '张票');
    
    const balanceNum = Number(balance);
    if (balanceNum === 0) {
      console.log('❌ 没有门票');
      return;
    }
    
    const foundTokens = [];
    
    // 策略：分批查询，每批 200 个，覆盖 token 1-2000
    const batchSize = 200;
    const maxTokenId = 2000;
    
    for (let start = 1; start <= maxTokenId; start += batchSize) {
      const end = Math.min(start + batchSize - 1, maxTokenId);
      
      console.log(`查询 token ${start}-${end}...`);
      
      const checkPromises = [];
      for (let tokenId = start; tokenId <= end; tokenId++) {
        checkPromises.push(
          contract.ownerOf(tokenId)
            .then(owner => {
              if (owner.toLowerCase() === userAddress.toLowerCase()) {
                return tokenId;
              }
              return null;
            })
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(checkPromises);
      const batchTokens = results.filter(id => id !== null);
      foundTokens.push(...batchTokens);
      
      if (batchTokens.length > 0) {
        console.log(`  找到 ${batchTokens.length} 个: ${batchTokens.join(', ')}`);
      }
      
      if (foundTokens.length >= balanceNum) {
        console.log('\n✅✅✅ 已找到所有门票！');
        break;
      }
    }
    
    console.log(`\n========== 查询完成 ==========`);
    console.log(`总共找到 ${foundTokens.length} 个 token:`, foundTokens);
    
    if (foundTokens.length === 0) {
      console.log('❌ token 1-2000 中没找到，可能 token ID 超过 2000');
    } else {
      console.log('\n获取详细信息:');
      for (const tokenId of foundTokens) {
        const info = await contract.getTicketInfo(tokenId);
        console.log(`Token ${tokenId}: ${info.eventName} - ${info.section}区 ${info.row}行${info.seat}座`);
      }
    }
  };
  document.head.appendChild(script);
})();

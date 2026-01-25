// 快速查询工具 - 智能批量查询
const CONTRACT_ADDRESS = '0x98c6af4c16F492ECD21206f17Ace979CcF021f98';
const CONTRACT_ABI = [
  "function totalSupply() external view returns (uint256)",
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

    console.log('========== 智能查询开始 ==========');
    
    // 1. 获取用户的余额
    const balance = await contract.balanceOf(userAddress);
    console.log('你的余额:', balance.toString(), '张票');
    
    const balanceNum = Number(balance);
    if (balanceNum === 0) {
      console.log('没有门票');
      return;
    }
    
    // 2. 获取总供应量（决定查询范围）
    const totalSupply = await contract.totalSupply();
    console.log('总供应量:', totalSupply.toString());
    
    const totalNum = Number(totalSupply);
    
    // 3. 根据总供应量决定查询策略
    let batchSize = 500;
    if (totalNum < 100) batchSize = 200;
    else if (totalNum < 500) batchSize = 300;
    else if (totalNum < 1000) batchSize = 400;
    
    console.log(`查询策略: 并发 ${batchSize} 个 token/批`);
    
    // 4. 分批查询
    const foundTokens = [];
    let checkedCount = 0;
    
    while (checkedCount < totalNum && foundTokens.length < balanceNum) {
      const batchEnd = Math.min(checkedCount + batchSize, totalNum);
      
      console.log(`查询范围 ${checkedCount + 1}-${batchEnd}...`);
      
      const checkPromises = [];
      for (let tokenId = checkedCount + 1; tokenId <= batchEnd; tokenId++) {
        checkPromises.push(
          contract.ownerOf(tokenId)
            .then(owner => {
              if (owner.toLowerCase() === userAddress.toLowerCase()) {
                console.log(`✅ 找到 token ${tokenId}`);
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
      
      checkedCount = batchEnd;
      
      if (foundTokens.length >= balanceNum) {
        console.log('已找到所有门票！');
        break;
      }
    }
    
    console.log(`\n========== 查询完成 ==========`);
    console.log(`查询了 ${checkedCount} 个 token`);
    console.log(`找到 ${foundTokens.length} 个 token:`, foundTokens);
    
    // 5. 获取详细信息
    console.log('\n获取详细信息...');
    for (const tokenId of foundTokens) {
      const info = await contract.getTicketInfo(tokenId);
      console.log(`Token ${tokenId}: ${info.eventName} - ${info.section}区 ${info.row}行${info.seat}座`);
    }
  };
  document.head.appendChild(script);
})();

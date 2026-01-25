// 在浏览器控制台粘贴这段代码来测试合约

(async function testContract() {
    console.log('========== 开始测试合约 ==========');

    const CONTRACT_ADDRESS = '0x98c6af4c16F492ECD21206f17Ace979CcF021f98';
    const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';

    try {
        // 方法1: 使用fetch调用RPC
        console.log('方法1: 直接调用RPC节点');
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: CONTRACT_ADDRESS,
                    data: '0x8da5cb5b' // owner()函数的签名
                }, 'latest'],
                id: 1
            })
        });
        const result = await response.json();
        console.log('RPC返回:', result);

        if (result.result) {
            const owner = '0x' + result.result.substring(26).substring(0, 40);
            console.log('✅ 方法1成功! Owner:', owner);
        } else {
            console.log('❌ 方法1失败:', result.error);
        }

        // 方法2: 使用window.ethereum
        console.log('\n方法2: 使用window.ethereum');
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const code = await provider.getCode(CONTRACT_ADDRESS);
                console.log('合约代码长度:', code.length);

                if (code !== '0x' && code.length > 2) {
                    const abi = ['function owner() external view returns (address)'];
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                    const owner = await contract.owner();
                    console.log('✅ 方法2成功! Owner:', owner);
                } else {
                    console.log('❌ 方法2: 合约不存在');
                }
            } catch (e) {
                console.log('❌ 方法2失败:', e.message);
            }
        } else {
            console.log('❌ window.ethereum未定义');
        }

        // 方法3: 使用JsonRpcProvider
        console.log('\n方法3: 使用JsonRpcProvider');
        try {
            const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const abi = ['function owner() external view returns (address)'];
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            const owner = await contract.owner();
            console.log('✅ 方法3成功! Owner:', owner);
        } catch (e) {
            console.log('❌ 方法3失败:', e.message);
        }

    } catch (error) {
        console.error('测试失败:', error);
    }
})();

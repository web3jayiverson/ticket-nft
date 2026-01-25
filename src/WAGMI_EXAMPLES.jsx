# Wagmi + Viem 使用示例

## 读取合约数据

```jsx
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

function MyComponent() {
  // 读取活动信息
  const { data: eventInfo, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEventInfo',
    args: [eventId], // 参数数组
    query: {
      enabled: isConnected, // 条件加载
    },
  });

  // 读取owner
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  if (isLoading) return <div>加载中...</div>;

  return <div>{eventInfo?.name}</div>;
}
```

## 写入合约数据

```jsx
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function BuyTicket({ eventId, section, row, seat, price }) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleBuy = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyTicket',
      args: [
        eventId,
        section,
        BigInt(row), // 使用BigInt
        BigInt(seat),
        'ipfs://QmExample',
      ],
      value: BigInt(Math.floor(price * 1e18)), // 转换为wei
    });
  };

  return (
    <button onClick={handleBuy} disabled={isPending || isConfirming}>
      {isPending ? '提交中...' : isConfirming ? '确认中...' : '购买'}
    </button>
  );
}
```

## 监听合约事件

```jsx
import { useWatchContractEvent } from 'wagmi';

function TicketWatcher() {
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'TicketPurchased',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('门票已购买:', log.args);
        // 刷新列表等操作
      });
    },
  });

  return <div>监听购票事件...</div>;
}
```

## 读取多个数据

```jsx
import { useReadContracts } from 'wagmi';

function EventList() {
  const { data: events } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getEventInfo',
        args: [0],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getEventInfo',
        args: [1],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getEventInfo',
        args: [2],
      },
      // ...更多活动
    ],
  });

  return (
    <div>
      {events?.map((event, index) => (
        <div key={index}>
          {event.result?.name}
        </div>
      ))}
    </div>
  );
}
```

## 账户和网络信息

```jsx
import { useAccount, useSwitchChain } from 'wagmi';

function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const switchToSepolia = () => {
    switchChain({ chainId: 11155111 });
  };

  if (!isConnected) {
    return <div>请连接钱包</div>;
  }

  return (
    <div>
      <p>地址: {address}</p>
      <p>网络: {chain?.name}</p>
      {chain?.id !== 11155111 && (
        <button onClick={switchToSepolia}>
          切换到 Sepolia
        </button>
      )}
    </div>
  );
}
```

## 批量查询（优化性能）

```jsx
// 方案1：使用eth_getBatch请求（更高效）
const batchCall = async (addresses) => {
  const calls = addresses.map(addr => ({
    to: CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: 'getEventInfo',
      args: [addr],
    }),
  }));

  const result = await publicClient.multicall({
    contracts: calls,
  });

  return result;
};

// 方案2：使用Promise.all并发请求
const loadEvents = async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getEventInfo',
        args: [i],
      })
    );
  }
  const events = await Promise.all(promises);
  return events;
};
```

## 价格转换

```jsx
// ETH 转 Wei
const ethToWei = (ethAmount) => {
  return BigInt(Math.floor(ethAmount * 1e18));
};

// Wei 转 ETH
const weiToEth = (weiAmount) => {
  return Number(weiAmount) / 1e18;
};

// 使用示例
const priceWei = ethToWei('0.001'); // "1000000000000000"
const priceEth = weiToEth(BigInt(1000000000000000)); // 0.001
```

## 注意事项

1. **BigInt**: Viem使用原生BigInt，不是ethers的BigNumber
2. **交易确认**: 使用useWaitForTransactionReceipt监听交易状态
3. **错误处理**: writeContract的错误在回调中处理
4. **性能优化**: 批量查询使用useReadContracts或multicall
5. **类型安全**: TypeScript中需要正确配置类型

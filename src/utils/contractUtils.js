import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

// 读取合约数据
export const useContractRead = (functionName, args = [], options = {}) => {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName,
    args,
    ...options,
  });
};

// 写入合约数据
export const useContractWrite = () => {
  return useWriteContract();
};

// 监听合约事件
export const useContractEvent = (eventName, callback, options = {}) => {
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName,
    onLogs: callback,
    ...options,
  });
};

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'TicketChain',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // 需要在 https://cloud.walletconnect.com 注册获取
  chains: [sepolia],
  ssr: true,
});

// 合约配置
export const CONTRACT_ADDRESS = '0x98c6af4c16F492ECD21206f17Ace979CcF021f98';

// 合约Owner地址（从合约创建者获取）
export const CONTRACT_OWNER = '0x5A4bA50900aD88886e65DD8927F8eCa3c86Ec06d';

// 合约 ABI（包含 ERC721 标准方法和自定义方法）
export const CONTRACT_ABI = [
  // ERC721 标准方法
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function owner() external view returns (address)",

  // 自定义方法
  "function getEventInfo(uint256 eventId) external view returns (string name, string venue, uint256 eventTime, uint256 ticketPrice, uint256 maxTickets, uint256 soldTickets, bool isActive)",
  "function getTicketInfo(uint256 tokenId) external view returns (uint256 eventId, string eventName, string section, uint256 row, uint256 seat, bool isVerified, address owner)",
  "function isTicketValid(uint256 tokenId) external view returns (bool)",
  "function buyTicket(uint256 eventId, string section, uint256 row, uint256 seat, string tokenURI) external payable",
  "function verifyTicket(uint256 tokenId) external",
  "function createEvent(string name, string venue, uint256 eventTime, uint256 ticketPrice, uint256 maxTickets, bool allowResale, uint256 maxResalePrice, uint256 resaleDeadline) external",

  // 事件
  "event EventCreated(uint256 indexed eventId, string name, uint256 eventTime)",
  "event TicketPurchased(uint256 indexed tokenId, uint256 eventId, address buyer)",
  "event TicketVerified(uint256 indexed tokenId, address verifier)"
];

// 网络配置
export const CHAIN_ID = 11155111; // Sepolia Testnet



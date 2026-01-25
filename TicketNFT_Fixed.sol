// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TicketNFT - 修复版票务NFT合约
 * @dev 修复了 buyTicket 函数中 tokenId 生成逻辑的bug
 *      原bug: 使用 _tokenIdCounter 递增作为 tokenId，但座位信息使用座位编码作为键
 *      修复: 直接使用座位编码作为 tokenId，确保一致性
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
    
    /**
     * @dev 创建新活动
     * @param name 活动名称
     * @param venue 场地
     * @param eventTime 活动时间（时间戳）
     * @param ticketPrice 门票价格（wei）
     * @param maxTickets 最大票数
     * @param allowResale 是否允许转售
     * @param maxResalePrice 最高转售价（wei）
     * @param resaleDeadline 转售截止时间（时间戳）
     */
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
    
    /**
     * @dev 购买门票（已修复）
     * @param eventId 活动ID
     * @param section 区域
     * @param row 排号
     * @param seat 座号
     * @param _tokenURI NFT元数据URI
     * 
     * 修复说明：
     * - 原bug: 使用 _tokenIdCounter.current() 作为 tokenId
     * - 修复: 直接使用 tokenIdFromSeat(eventId, row, seat) 作为 tokenId
     * - 这样确保 tokenId 和座位信息键一致
     */
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
    
    /**
     * @dev 核销门票
     * @param tokenId 门票ID
     */
    function verifyTicket(uint256 tokenId) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Ticket does not exist");
        
        // 从 tokenId 解析出 eventId 和座位信息
        SeatInfo storage seatInfo = seatInfos[tokenId];
        require(seatInfo.isValid, "Invalid ticket");
        require(!seatInfo.isVerified, "Already verified");
        
        seatInfo.isVerified = true;
        emit TicketVerified(tokenId, msg.sender);
    }
    
    /**
     * @dev 查询票务信息
     * @param tokenId 门票ID
     */
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
    
    /**
     * @dev 辅助函数：从tokenId解析座位信息
     * @param tokenId 门票ID
     * @return eventId 活动ID
     * @return row 排号
     * @return seat 座号
     * 
     * 编码格式: eventId * 10000 + row * 100 + seat
     * 示例: eventId=5, row=12, seat=34 => tokenId=51234
     */
    function getSeatFromToken(uint256 tokenId) internal pure returns (uint256, uint256, uint256) {
        uint256 eventId = tokenId / 10000;
        uint256 row = (tokenId % 10000) / 100;
        uint256 seat = tokenId % 100;
        return (eventId, row, seat);
    }
    
    /**
     * @dev 辅助函数：根据座位信息生成tokenId
     * @param eventId 活动ID
     * @param row 排号
     * @param seat 座号
     * @return tokenId 门票ID
     */
    function tokenIdFromSeat(uint256 eventId, uint256 row, uint256 seat) internal pure returns (uint256) {
        return eventId * 10000 + row * 100 + seat;
    }
    
    /**
     * @dev 检查门票是否有效
     * @param tokenId 门票ID
     * @return bool 是否有效
     */
    function isTicketValid(uint256 tokenId) external view returns (bool) {
        if (ownerOf(tokenId) == address(0)) return false;
        
        SeatInfo storage seatInfo = seatInfos[tokenId];
        return seatInfo.isValid && !seatInfo.isVerified;
    }
    
    /**
     * @dev 查询活动信息
     * @param eventId 活动ID
     */
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
    
    /**
     * @dev 退款（主办方可取消活动）
     * @param eventId 活动ID
     */
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../TicketNFT_Fixed.sol";

contract SecurityTest is Test {
    TicketNFT public ticketNFT;
    address public owner;
    address public user1;
    address public user2;
    address public attacker;

    uint256 constant EVENT_ID = 0;
    string constant SECTION = "A区";
    uint256 constant ROW = 1;
    uint256 constant SEAT = 1;
    uint256 constant TICKET_PRICE = 0.001 ether;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        attacker = address(0x3);

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(attacker, 10 ether);

        ticketNFT = new TicketNFT();

        // 创建测试活动
        vm.prank(owner);
        ticketNFT.createEvent(
            "演唱会",
            "体育馆",
            block.timestamp + 30 days,
            TICKET_PRICE,
            1000,
            false,
            0,
            0
        );
    }

    // ========== 1. 访问控制测试 ==========

    function test_NonOwnerCannotCreateEvent() public {
        vm.expectRevert();
        vm.prank(user1);
        ticketNFT.createEvent(
            "活动",
            "场地",
            block.timestamp,
            1 ether,
            100,
            false,
            0,
            0
        );
    }

    function test_NonOwnerCannotVerifyTicket() public {
        // 先购买一张票
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );

        uint256 tokenId = EVENT_ID * 10000 + ROW * 100 + SEAT;

        // 非owner尝试核销
        vm.expectRevert();
        vm.prank(user2);
        ticketNFT.verifyTicket(tokenId);
    }

    // ========== 2. 边界值测试 ==========

    function test_BuyTicketWithZeroPrice() public {
        vm.expectRevert();  // 应该失败或被拒绝
        vm.prank(user1);
        ticketNFT.buyTicket{value: 0}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );
    }

    function test_BuyTicketWithInsufficientPayment() public {
        vm.expectRevert("Insufficient payment");
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE - 1}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );
    }

    function test_BuyTicketWithExcessPayment() public {
        // 应该成功，多余金额应该返还或保留
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE * 2}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );

        // 检查是否成功
        uint256 tokenId = EVENT_ID * 10000 + ROW * 100 + SEAT;
        assertEq(ticketNFT.ownerOf(tokenId), user1);
    }

    // ========== 3. 重复操作测试 ==========

    function test_BuySameSeatTwice() public {
        // 第一次购买
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test1"
        );

        // 尝试购买同一座位
        vm.expectRevert("Seat already taken");
        vm.prank(user2);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test2"
        );
    }

    function test_VerifyTicketTwice() public {
        // 购买票
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );

        uint256 tokenId = EVENT_ID * 10000 + ROW * 100 + SEAT;

        // 第一次核销
        vm.prank(owner);
        ticketNFT.verifyTicket(tokenId);

        // 第二次核销
        vm.expectRevert("Already verified");
        vm.prank(owner);
        ticketNFT.verifyTicket(tokenId);
    }

    // ========== 4. 极端输入测试 ==========

    function test_BuyTicketWithZeroEventId() public {
        vm.expectRevert("Event is not active");
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            0,  // 不存在的活动
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );
    }

    function test_BuyTicketWithLargeRowAndSeat() public {
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            type(uint256).max,  // 极大值
            type(uint256).max,
            "ipfs://test"
        );

        // 检查tokenId计算是否溢出
        uint256 tokenId = ticketNFT.tokenOfOwnerByIndex(user1, 0);
        assertTrue(tokenId > 0);
    }

    // ========== 5. 状态测试 ==========

    function test_BuyTicketForInactiveEvent() public {
        // 取消活动
        vm.prank(owner);
        ticketNFT.refundTickets(EVENT_ID);

        // 尝试购买已取消的活动
        vm.expectRevert("Event is not active");
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );
    }

    function test_BuyTicketSoldOut() public {
        // 购买所有票（假设只有100张）
        for (uint256 i = 0; i < 100; i++) {
            vm.prank(user1);
            ticketNFT.buyTicket{value: TICKET_PRICE}(
                EVENT_ID,
                SECTION,
                i / 10 + 1,  // row
                i % 10 + 1,      // seat
                string(abi.encodePacked("ipfs://", i))
            );
        }

        // 尝试购买第101张
        vm.expectRevert("Sold out");
        vm.prank(user2);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            101,
            1,
            "ipfs://test"
        );
    }

    // ========== 6. Gas 优化测试 ==========

    function test_GasCost() public {
        vm.prank(user1);
        uint256 gasBefore = gasleft();

        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://test"
        );

        uint256 gasUsed = gasBefore - gasleft();
        emit log_uint("Gas used for buyTicket:", gasUsed);

        // Gas 应该在合理范围内
        assertTrue(gasUsed < 200000, "Gas usage too high");
    }

    // ========== 7. 前端运行攻击测试 ==========

    function test_FrontRunningAttack() public {
        // 攻击者监听交易池，尝试用更高的Gas抢跑
        vm.prank(user1);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://original"
        );

        // 攻击者尝试用相同参数
        vm.expectRevert("Seat already taken");
        vm.prank(attacker);
        ticketNFT.buyTicket{value: TICKET_PRICE}(
            EVENT_ID,
            SECTION,
            ROW,
            SEAT,
            "ipfs://attack"
        );
    }
}

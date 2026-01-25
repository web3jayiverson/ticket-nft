/**
 * TicketNFT 合约测试脚本
 * 用于验证修复后的合约是否正常工作
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🧪 开始测试 TicketNFT 合约...\n");

  // 部署合约
  console.log("1️⃣  部署合约...");
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();
  const contractAddress = await ticketNFT.getAddress();
  console.log("✅ 合约已部署到:", contractAddress, "\n");

  // 获取签名者
  const [owner, buyer1, buyer2] = await ethers.getSigners();
  console.log("👤 测试账户:");
  console.log("   Owner:", owner.address);
  console.log("   Buyer1:", buyer1.address);
  console.log("   Buyer2:", buyer2.address, "\n");

  // 创建测试活动
  console.log("2️⃣  创建测试活动...");
  
  const eventTx1 = await ticketNFT.connect(owner).createEvent(
    "周杰伦2025演唱会",
    "上海梅赛德斯奔驰中心",
    Math.floor(Date.now() / 1000) + 86400 * 30, // 30天后
    ethers.parseEther("0.001"),
    1000,
    true,
    ethers.parseEther("0.0015"),
    Math.floor(Date.now() / 1000) + 86400 * 25
  );
  await eventTx1.wait();
  console.log("✅ 活动0创建成功: 周杰伦2025演唱会");

  const eventTx2 = await ticketNFT.connect(owner).createEvent(
    "鹿晗巡回演唱会",
    "北京鸟巢",
    Math.floor(Date.now() / 1000) + 86400 * 60, // 60天后
    ethers.parseEther("0.002"),
    2000,
    true,
    ethers.parseEther("0.003"),
    Math.floor(Date.now() / 1000) + 86400 * 55
  );
  await eventTx2.wait();
  console.log("✅ 活动1创建成功: 鹿晗巡回演唱会");

  const eventTx3 = await ticketNFT.connect(owner).createEvent(
    "陶喆演唱会",
    "广州体育馆",
    Math.floor(Date.now() / 1000) + 86400 * 90, // 90天后
    ethers.parseEther("0.0005"),
    500,
    false,
    0,
    0
  );
  await eventTx3.wait();
  console.log("✅ 活动2创建成功: 陶喆演唱会\n");

  // 查询活动信息
  console.log("3️⃣  查询活动信息...");
  const event0 = await ticketNFT.getEventInfo(0);
  console.log("   活动0:", event0[0]);
  const event1 = await ticketNFT.getEventInfo(1);
  console.log("   活动1:", event1[0]);
  const event2 = await ticketNFT.getEventInfo(2);
  console.log("   活动2:", event2[0], "\n");

  // 购买门票 - 测试修复后的逻辑
  console.log("4️⃣  购买门票（测试修复后的逻辑）...");

  // Buyer1 购买活动0的门票
  const buyTx1 = await ticketNFT.connect(buyer1).buyTicket(
    0,                     // eventId: 0
    "A区",                  // section
    5,                      // row
    10,                     // seat
    "ipfs://ticket1",       // tokenURI
    { value: ethers.parseEther("0.001") }
  );
  await buyTx1.wait();
  console.log("✅ Buyer1 购买门票成功 - 活动0, 排5, 座10");
  console.log("   预期 tokenId:", 0 * 10000 + 5 * 100 + 10, "= 510");

  // Buyer1 购买活动1的门票
  const buyTx2 = await ticketNFT.connect(buyer1).buyTicket(
    1,                     // eventId: 1
    "B区",                  // section
    3,                      // row
    15,                     // seat
    "ipfs://ticket2",       // tokenURI
    { value: ethers.parseEther("0.002") }
  );
  await buyTx2.wait();
  console.log("✅ Buyer1 购买门票成功 - 活动1, 排3, 座15");
  console.log("   预期 tokenId:", 1 * 10000 + 3 * 100 + 15, "= 10315");

  // Buyer2 购买活动2的门票
  const buyTx3 = await ticketNFT.connect(buyer2).buyTicket(
    2,                     // eventId: 2
    "C区",                  // section
    8,                      // row
    20,                     // seat
    "ipfs://ticket3",       // tokenURI
    { value: ethers.parseEther("0.0005") }
  );
  await buyTx3.wait();
  console.log("✅ Buyer2 购买门票成功 - 活动2, 排8, 座20");
  console.log("   预期 tokenId:", 2 * 10000 + 8 * 100 + 20, "= 20820", "\n");

  // 查询门票信息 - 验证修复是否成功
  console.log("5️⃣  查询门票信息（验证修复结果）...");

  const ticket1Info = await ticketNFT.getTicketInfo(510);
  console.log("\n   门票 510:");
  console.log("   - Event ID:", ticket1Info[0].toString());
  console.log("   - Event Name:", ticket1Info[1]);
  console.log("   - Section:", ticket1Info[2]);
  console.log("   - Row:", ticket1Info[3].toString());
  console.log("   - Seat:", ticket1Info[4].toString());
  console.log("   - Is Verified:", ticket1Info[5]);

  const ticket2Info = await ticketNFT.getTicketInfo(10315);
  console.log("\n   门票 10315:");
  console.log("   - Event ID:", ticket2Info[0].toString());
  console.log("   - Event Name:", ticket2Info[1]);
  console.log("   - Section:", ticket2Info[2]);
  console.log("   - Row:", ticket2Info[3].toString());
  console.log("   - Seat:", ticket2Info[4].toString());
  console.log("   - Is Verified:", ticket2Info[5]);

  const ticket3Info = await ticketNFT.getTicketInfo(20820);
  console.log("\n   门票 20820:");
  console.log("   - Event ID:", ticket3Info[0].toString());
  console.log("   - Event Name:", ticket3Info[1]);
  console.log("   - Section:", ticket3Info[2]);
  console.log("   - Row:", ticket3Info[3].toString());
  console.log("   - Seat:", ticket3Info[4].toString());
  console.log("   - Is Verified:", ticket3Info[5]);

  // 验证修复结果
  console.log("\n6️⃣  验证修复结果...");

  let testPassed = true;

  // 验证门票1
  if (ticket1Info[0].toString() !== "0") {
    console.log("❌ 测试失败: 门票510的Event ID应该是0，但得到", ticket1Info[0].toString());
    testPassed = false;
  } else if (ticket1Info[1] !== "周杰伦2025演唱会") {
    console.log("❌ 测试失败: 门票510的Event Name应该是'周杰伦2025演唱会'，但得到", ticket1Info[1]);
    testPassed = false;
  } else {
    console.log("✅ 门票510验证通过 - 正确关联到活动0");
  }

  // 验证门票2
  if (ticket2Info[0].toString() !== "1") {
    console.log("❌ 测试失败: 门票10315的Event ID应该是1，但得到", ticket2Info[0].toString());
    testPassed = false;
  } else if (ticket2Info[1] !== "鹿晗巡回演唱会") {
    console.log("❌ 测试失败: 门票10315的Event Name应该是'鹿晗巡回演唱会'，但得到", ticket2Info[1]);
    testPassed = false;
  } else {
    console.log("✅ 门票10315验证通过 - 正确关联到活动1");
  }

  // 验证门票3
  if (ticket3Info[0].toString() !== "2") {
    console.log("❌ 测试失败: 门票20820的Event ID应该是2，但得到", ticket3Info[0].toString());
    testPassed = false;
  } else if (ticket3Info[1] !== "陶喆演唱会") {
    console.log("❌ 测试失败: 门票20820的Event Name应该是'陶喆演唱会'，但得到", ticket3Info[1]);
    testPassed = false;
  } else {
    console.log("✅ 门票20820验证通过 - 正确关联到活动2");
  }

  // 测试核销功能
  console.log("\n7️⃣  测试核销功能...");
  const isValidBefore = await ticketNFT.isTicketValid(510);
  console.log("   门票510是否有效（核销前）:", isValidBefore);

  await ticketNFT.connect(owner).verifyTicket(510);
  console.log("   ✅ 门票510已核销");

  const isValidAfter = await ticketNFT.isTicketValid(510);
  console.log("   门票510是否有效（核销后）:", isValidAfter);

  if (isValidBefore && !isValidAfter) {
    console.log("✅ 核销功能测试通过");
  } else {
    console.log("❌ 核销功能测试失败");
    testPassed = false;
  }

  // 最终结果
  console.log("\n" + "=".repeat(50));
  if (testPassed) {
    console.log("🎉 所有测试通过！Bug已成功修复！");
    console.log("=".repeat(50));
    console.log("\n📝 下一步：");
    console.log("1. 将此合约部署到 Sepolia 测试网");
    console.log("2. 更新前端 config.js 中的 CONTRACT_ADDRESS");
    console.log("3. 在前端测试完整功能");
  } else {
    console.log("❌ 部分测试失败，请检查合约代码");
    console.log("=".repeat(50));
  }
}

// 运行测试
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

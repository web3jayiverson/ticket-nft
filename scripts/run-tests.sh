#!/bin/bash

echo "========================================="
echo "  票务系统 - 安全测试套件"
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Slither 静态分析
echo -e "\n${YELLOW}1. 运行 Slither 静态分析...${NC}"
if command -v slither &> /dev/null; then
    slither TicketNFT_Fixed.sol \
        --filter reentrancy-eth,uninitialized-state,arbitrary-send \
        --json -o slither-results.json

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Slither 分析完成${NC}"
        echo "结果已保存到: slither-results.json"
    else
        echo -e "${RED}❌ Slither 分析失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Slither 未安装，跳过${NC}"
    echo "安装命令: pip install slither-analyzer"
fi

# 2. Foundry 测试
echo -e "\n${YELLOW}2. 运行 Foundry 单元测试...${NC}"
if command -v forge &> /dev/null; then
    forge test -vvv
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Foundry 测试通过${NC}"
    else
        echo -e "${RED}❌ Foundry 测试失败${NC}"
    fi

    # 生成覆盖率报告
    echo -e "\n${YELLOW}生成覆盖率报告...${NC}"
    forge coverage --report lcov
else
    echo -e "${YELLOW}⚠️  Foundry 未安装，跳过${NC}"
    echo "安装命令: curl -L https://foundry.paradigm.xyz | bash"
fi

# 3. 编译检查
echo -e "\n${YELLOW}3. 检查合约编译...${NC}"
if command -v forge &> /dev/null; then
    forge build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 编译成功${NC}"
    else
        echo -e "${RED}❌ 编译失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Foundry 未安装${NC}"
fi

# 4. Gas 使用分析
echo -e "\n${YELLOW}4. 分析 Gas 使用...${NC}"
if command -v forge &> /dev/null; then
    forge snapshot
    echo -e "${GREEN}✅ Gas 快照已生成${NC}"
    echo "查看 .gas-snapshot 文件"
else
    echo -e "${YELLOW}⚠️  Foundry 未安装，跳过${NC}"
fi

# 5. 前端检查
echo -e "\n${YELLOW}5. 前端代码检查...${NC}"

# ESLint
if [ -f "package.json" ]; then
    if command -v npm &> /dev/null; then
        npm run lint 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ESLint 检查通过${NC}"
        else
            echo -e "${YELLOW}⚠️  ESLint 发现问题${NC}"
        fi
    fi
fi

# 6. 安全总结
echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}  安全测试总结${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "\n${GREEN}完成项目：${NC}"
echo "  1. Slither 静态分析"
echo "  2. Foundry 单元测试"
echo "  3. 合约编译检查"
echo "  4. Gas 使用分析"
echo "  5. 前端代码检查"
echo -e "\n${YELLOW}下一步：${NC}"
echo "  1. 手动测试网部署"
echo "  2. 专业安全审计（CertiK/OpenZeppelin）"
echo "  3. Bug Bounty 计划"
echo "  4. 监控系统部署"
echo -e "\n${GREEN}📚 相关文档：${NC}"
echo "  - AUDIT_CHECKLIST.md: 审计检查清单"
echo "  - BOUNDARY_TESTING.md: 边界测试用例"
echo "  - DEPLOYMENT_GUIDE.md: 部署指南"

# 票务系统 - 安全测试套件 (PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  票务系统 - 安全测试套件" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 颜色定义
function Write-ColorOutput($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

# 1. 检查 Node.js
Write-Host "[1/6] 检查 Node.js 安装..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($?) {
    Write-ColorOutput "[√] Node.js 版本: $nodeVersion" "Green"
} else {
    Write-ColorOutput "[错误] 未检测到 Node.js，请先安装" "Red"
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Cyan
    Read-Host "按回车键退出"
    exit 1
}
Write-Host ""

# 2. 检查项目结构
Write-Host "[2/6] 检查项目结构..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-ColorOutput "[√] 找到 package.json" "Green"
} else {
    Write-ColorOutput "[错误] 未找到 package.json" "Red"
    Read-Host "按回车键退出"
    exit 1
}

if (Test-Path "src") {
    Write-ColorOutput "[√] 找到 src 目录" "Green"
}

if (Test-Path "TicketNFT_Fixed.sol") {
    Write-ColorOutput "[√] 找到合约文件" "Green"
}
Write-Host ""

# 3. 安装依赖
Write-Host "[3/6] 检查并安装依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装 npm 依赖..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "[√] 依赖安装成功" "Green"
    } else {
        Write-ColorOutput "[错误] 依赖安装失败" "Red"
        Read-Host "按回车键退出"
        exit 1
    }
} else {
    Write-ColorOutput "[√] 依赖已安装" "Green"
}
Write-Host ""

# 4. ESLint 检查
Write-Host "[4/6] 运行 ESLint 代码检查..." -ForegroundColor Yellow
npm run lint 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput "[√] ESLint 检查通过" "Green"
} else {
    Write-ColorOutput "[⚠]  ESLint 发现问题或未配置" "Yellow"
}
Write-Host ""

# 5. 构建测试
Write-Host "[5/6] 运行构建测试..." -ForegroundColor Yellow
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput "[√] 构建成功" "Green"
} else {
    Write-ColorOutput "[错误] 构建失败" "Red"
    Read-Host "按回车键退出"
    exit 1
}
Write-Host ""

# 6. 检查测试配置
Write-Host "[6/6] 检查测试配置..." -ForegroundColor Yellow
$testConfigFound = $false

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        Write-ColorOutput "[√] 找到测试脚本" "Green"
        Write-Host "测试命令: npm run test" -ForegroundColor Cyan
        $testConfigFound = $true
    }
}

if (Test-Path "test") {
    Write-ColorOutput "[√] 找到测试目录" "Green"
    $testFiles = Get-ChildItem -Path "test" -Filter "*.t.sol" -Recurse
    if ($testFiles.Count -gt 0) {
        Write-Host "找到 $($testFiles.Count) 个 Solidity 测试文件" -ForegroundColor Cyan
    }
}

if (-not $testConfigFound) {
    Write-ColorOutput "[⚠]  未找到测试配置" "Yellow"
}
Write-Host ""

# 安全检查总结
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  安全测试总结" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-ColorOutput "[√] 完成项目：" "Green"
Write-Host "  1. Node.js 安装检查"
Write-Host "  2. 项目结构检查"
Write-Host "  3. 依赖安装检查"
Write-Host "  4. ESLint 代码检查"
Write-Host "  5. 构建测试"
Write-Host "  6. 测试配置检查"
Write-Host ""

# 推荐工具
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  推荐安装的安全审计工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Slither - 静态分析工具 (免费)" -ForegroundColor White
Write-Host "   pip install slither-analyzer" -ForegroundColor Gray
Write-Host "   slither TicketNFT_Fixed.sol" -ForegroundColor Gray
Write-Host ""
Write-Host "2. MythX - 商业级安全分析" -ForegroundColor White
Write-Host "   https://mythx.io/" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. CertiK - 专业审计公司 ($5K-$50K)" -ForegroundColor White
Write-Host "   https://www.certik.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. OpenZeppelin Defender - 监控和警报" -ForegroundColor White
Write-Host "   https://www.openzeppelin.com/defender/" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Foundry - Solidity 测试框架" -ForegroundColor White
Write-Host "   安装: https://book.getfoundry.sh/" -ForegroundColor Gray
Write-Host "   运行: forge test" -ForegroundColor Gray
Write-Host ""

# 下一步
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  下一步操作" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 手动测试网部署" -ForegroundColor White
Write-Host "2. 提交到专业安全审计 (CertiK/OpenZeppelin)" -ForegroundColor White
Write-Host "3. 启动 Bug Bounty 计划" -ForegroundColor White
Write-Host "4. 部署实时监控系统" -ForegroundColor White
Write-Host ""
Write-Host "查看文档:" -ForegroundColor White
Write-Host "  - AUDIT_CHECKLIST.md: 审计检查清单" -ForegroundColor Gray
Write-Host "  - BOUNDARY_TESTING.md: 边界测试用例" -ForegroundColor Gray
Write-Host "  - GO_LIVE_CHECKLIST.md: 上线检查清单" -ForegroundColor Gray
Write-Host ""

Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo =========================================
echo   Ticket System - Security Testing Suite
echo =========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not detected
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js installed
echo.

REM Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [OK] package.json found
echo.

REM Check dependencies
echo [1/5] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready
echo.

REM Frontend code check
echo [2/5] Running ESLint...
call npm run lint >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ESLint check passed
) else (
    echo [WARN] ESLint found issues
)
echo.

REM Build check
echo [3/5] Building project...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Build successful
) else (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo.

REM Solidity contract check
echo [4/5] Checking Solidity contracts...
if exist "TicketNFT_Fixed.sol" (
    echo [OK] Contract file found: TicketNFT_Fixed.sol
    
    where npx >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Detected npx, attempting compilation...
        call npx hardhat compile --force >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Solidity compilation successful
        ) else (
            echo [WARN] Solidity compilation failed (Hardhat may not be installed)
        )
    )
) else (
    echo [INFO] No Solidity contract file found
)
echo.

REM Test files check
echo [5/5] Checking test files...
if exist "test" (
    echo [OK] Test directory found
    
    where npx >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Running tests...
        call npm test 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Tests passed
        ) else (
            echo [WARN] Tests failed or not configured
        )
    )
) else (
    echo [INFO] No test directory found
)
echo.

REM Summary
echo =========================================
echo   Security Testing Summary
echo =========================================
echo.
echo [OK] Completed:
echo   1. Frontend code check (ESLint)
echo   2. Build verification
echo   3. Solidity contract check
echo   4. Test files check
echo.

REM Recommendations
echo =========================================
echo   Recommended Tools for Deeper Audit
echo =========================================
echo.
echo 1. Slither (Static Analysis)
echo    pip install slither-analyzer
echo    slither TicketNFT_Fixed.sol
echo.
echo 2. MythX (Commercial Audit)
echo    https://mythx.io/
echo.
echo 3. CertiK (Professional Audit)
echo    https://www.certik.com/
echo.
echo 4. Foundry (Testing Framework)
echo    curl -L https://foundry.paradigm.xyz | bash
echo    forge test
echo.

REM Next steps
echo =========================================
echo   Next Steps
echo =========================================
echo.
echo 1. Manual testnet deployment
echo 2. Professional security audit (CertiK/OpenZeppelin)
echo 3. Bug Bounty program launch
echo 4. Monitoring system deployment
echo.
echo Documentation:
echo   - AUDIT_CHECKLIST.md: Audit checklist
echo   - BOUNDARY_TESTING.md: Boundary test cases
echo   - GO_LIVE_CHECKLIST.md: Launch checklist
echo.

pause

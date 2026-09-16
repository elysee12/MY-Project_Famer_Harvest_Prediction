@echo off
echo ============================================================
echo APPLYING EMAIL CONFIGURATION
echo ============================================================
echo.
echo Setting up email credentials...
echo Email: harvestpredictor@gmail.com
echo Password: smcxbulylbxrohkn (App Password - spaces removed)
echo.

REM Set environment variables for current session
set EMAIL_HOST=smtp.gmail.com
set EMAIL_PORT=587
set SMTP_USER=harvestpredictor@gmail.com
set SMTP_PASS=smcxbulylbxrohkn

REM Save permanently (remove spaces from app password)
setx EMAIL_HOST "smtp.gmail.com"
setx EMAIL_PORT "587"
setx SMTP_USER "harvestpredictor@gmail.com"
setx SMTP_PASS "smcxbulylbxrohkn"

echo.
echo ============================================================
echo Configuration applied!
echo ============================================================
echo.
echo Testing email configuration...
echo.

REM Test the configuration
python test_email_config.py

echo.
echo ============================================================
echo NEXT STEPS:
echo ============================================================
echo 1. If test passed: You're ready to go!
echo 2. If test failed: Check Gmail App Password is correct
echo 3. Restart your IDE/terminal for permanent variables
echo.
pause

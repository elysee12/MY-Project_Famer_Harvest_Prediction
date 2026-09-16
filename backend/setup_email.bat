@echo off
echo ============================================================
echo EMAIL CONFIGURATION SETUP
echo ============================================================
echo.
echo This script will help you set up email configuration.
echo.
echo IMPORTANT: For Gmail, you MUST:
echo   1. Enable 2-Factor Authentication on your Gmail account
echo   2. Generate an App Password at:
echo      https://myaccount.google.com/apppasswords
echo   3. Use the App Password (16 characters, no spaces)
echo.
echo ============================================================
echo.

set /p EMAIL_USER="harvestpredictor@gmail.com"
set /p EMAIL_PASS="smcx buly lbxr ohkn"

echo.
echo Setting environment variables...
setx EMAIL_HOST "smtp.gmail.com"
setx EMAIL_PORT "587"
setx SMTP_USER "%EMAIL_USER%"
setx SMTP_PASS "%EMAIL_PASS%"

echo.
echo ============================================================
echo Configuration saved!
echo ============================================================
echo.
echo IMPORTANT: You must RESTART your terminal/IDE for changes to take effect!
echo.
echo After restarting, run: python test_email_config.py
echo.
pause

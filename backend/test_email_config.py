"""
Test email configuration
"""
import os

print("=" * 60)
print("EMAIL CONFIGURATION CHECK")
print("=" * 60)

# Check environment variables
print("\n1. Checking environment variables:")
print("-" * 60)

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASS = os.getenv('SMTP_PASS', '')
GMAIL_API_FALLBACK = os.getenv('GMAIL_API_FALLBACK', 'false').lower() == 'true'

print(f"EMAIL_HOST: {EMAIL_HOST}")
print(f"EMAIL_PORT: {EMAIL_PORT}")
print(f"SMTP_USER: {'[SET]' if SMTP_USER else '[NOT SET]'} ({SMTP_USER if SMTP_USER else 'Missing'})")
print(f"SMTP_PASS: {'[SET]' if SMTP_PASS else '[NOT SET]'} ({'*' * len(SMTP_PASS) if SMTP_PASS else 'Missing'})")
print(f"GMAIL_API_FALLBACK: {GMAIL_API_FALLBACK}")

print("\n2. Configuration Status:")
print("-" * 60)

if not SMTP_USER or not SMTP_PASS:
    print("❌ SMTP credentials are NOT configured")
    print("\n⚠️  EMAILS WILL NOT BE SENT!")
    print("\nTo fix this, set environment variables:")
    print("   EMAIL_HOST=smtp.gmail.com")
    print("   EMAIL_PORT=587")
    print("   SMTP_USER=your-email@gmail.com")
    print("   SMTP_PASS=your-app-password")
    print("\nFor Gmail:")
    print("   1. Enable 2-Factor Authentication")
    print("   2. Go to: https://myaccount.google.com/apppasswords")
    print("   3. Create an App Password for 'Mail'")
    print("   4. Use that password (16 characters without spaces)")
else:
    print("✅ SMTP credentials are configured")
    print("\n3. Testing SMTP connection:")
    print("-" * 60)
    
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        print(f"Connecting to {EMAIL_HOST}:{EMAIL_PORT}...")
        
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10) as server:
            server.ehlo()
            print("✓ EHLO successful")
            
            server.starttls()
            print("✓ STARTTLS successful")
            
            server.ehlo()
            print("✓ Second EHLO successful")
            
            server.login(SMTP_USER, SMTP_PASS)
            print("✓ Login successful")
            
        print("\n✅ EMAIL CONFIGURATION IS WORKING!")
        print("   Emails should be sent successfully.")
        
    except Exception as e:
        print(f"\n❌ Connection test FAILED: {e}")
        print("\nPossible issues:")
        print("   - Wrong email/password")
        print("   - 2FA not enabled on Gmail")
        print("   - Not using App Password")
        print("   - Firewall blocking port 587")
        print("   - Gmail security settings")

print("\n" + "=" * 60)

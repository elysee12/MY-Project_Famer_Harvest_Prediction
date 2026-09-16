"""
Send a real test email to verify the email system is working
"""
import os
import sys

# Set environment variables for this session
os.environ['EMAIL_HOST'] = 'smtp.gmail.com'
os.environ['EMAIL_PORT'] = '587'
os.environ['SMTP_USER'] = 'harvestpredictor@gmail.com'
os.environ['SMTP_PASS'] = 'smcxbulylbxrohkn'

print("=" * 60)
print("SENDING TEST EMAIL")
print("=" * 60)
print()

# Import after setting environment variables
from flask_api import send_email

# Prepare test email
recipient = 'harvestpredictor@gmail.com'  # Send to self for testing
subject = '✅ Test Email - Harvest Prediction System'

body_html = """
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 Email System Working!</h1>
        <p style="color: #ccfbf1; margin: 10px 0 0 0;">Harvest Prediction System</p>
    </div>
    
    <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #0f172a;">Email Configuration Successful!</h2>
        
        <p style="color: #334155; font-size: 16px;">
            If you're reading this email, it means your email configuration is working perfectly! ✅
        </p>
        
        <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">
                ✓ SMTP Connection Successful<br/>
                ✓ Authentication Working<br/>
                ✓ Email Delivery Confirmed
            </p>
        </div>
        
        <h3 style="color: #0f172a;">System Information:</h3>
        <ul style="color: #334155; line-height: 1.8;">
            <li><strong>Email Server:</strong> smtp.gmail.com</li>
            <li><strong>Port:</strong> 587 (TLS)</li>
            <li><strong>Sender:</strong> harvestpredictor@gmail.com</li>
            <li><strong>Status:</strong> ✅ Operational</li>
        </ul>
        
        <p style="color: #334155; font-size: 14px; margin-top: 30px;">
            You can now:
        </p>
        <ul style="color: #334155; line-height: 1.8;">
            <li>Create cooperatives and send welcome emails to leaders</li>
            <li>Send approval/rejection notifications to farmers</li>
            <li>Send system notifications and updates</li>
        </ul>
    </div>
    
    <div style="background: #0f172a; padding: 20px; text-align: center;">
        <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            © 2024 Harvest Prediction System | UNIVERSITY OF KIGALI | Bugesera District
        </p>
    </div>
</div>
"""

body_text = """
EMAIL SYSTEM WORKING!

If you're reading this email, your email configuration is working perfectly!

✓ SMTP Connection Successful
✓ Authentication Working
✓ Email Delivery Confirmed

System Information:
- Email Server: smtp.gmail.com
- Port: 587 (TLS)
- Sender: harvestpredictor@gmail.com
- Status: ✅ Operational

You can now create cooperatives and send notifications!

© 2024 Harvest Prediction System | UNIVERSITY OF KIGALI
"""

print(f"Sending test email to: {recipient}")
print("Subject:", subject)
print()

try:
    sent, error = send_email(recipient, subject, body_html, body_text)
    
    if sent:
        print("=" * 60)
        print("✅ SUCCESS! TEST EMAIL SENT!")
        print("=" * 60)
        print()
        print(f"Check your inbox: {recipient}")
        print("The email should arrive within a few seconds.")
        print()
        print("If you don't see it:")
        print("  1. Check your Spam/Junk folder")
        print("  2. Wait a few minutes (sometimes delayed)")
        print("  3. Check the email address is correct")
        print()
    else:
        print("=" * 60)
        print("❌ FAILED TO SEND EMAIL")
        print("=" * 60)
        print()
        print(f"Error: {error}")
        print()
        
except Exception as e:
    print("=" * 60)
    print("❌ ERROR OCCURRED")
    print("=" * 60)
    print()
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()
    print()

print("=" * 60)

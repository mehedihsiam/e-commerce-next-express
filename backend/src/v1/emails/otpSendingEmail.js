/**
 * Generates a dynamic HTML OTP email template
 * @param {Object} options - Email template options
 * @param {string} options.email - User's email address
 * @param {string} options.otp - One-time password/verification code
 * @param {string} [options.userName] - User's name (optional)
 * @param {string} [options.companyName] - Company name (default: E-Commerce Express)
 * @param {string} [options.logoUrl] - Company logo URL
 * @param {string} [options.purpose] - Purpose of OTP (default: account verification)
 * @param {number} [options.expiryMinutes] - OTP expiry time in minutes (default: 10)
 * @param {string} [options.supportEmail] - Support email address
 * @param {Object} [options.theme] - Theme colors
 * @returns {string} HTML email template for OTP
 */
const otpSendingEmail = (options = {}) => {
  const {
    email = '',
    otp = '',
    userName = '',
    companyName = 'E-Commerce Express',
    logoUrl = '',
    purpose = 'account verification',
    expiryMinutes = 10,
    supportEmail = 'support@ecommerce-express.com',
  } = options;

  const theme = {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    background: '#f8f9fa',
    text: '#212529',
    textLight: '#6c757d',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Your Verification Code - ${companyName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${theme.text};
            background-color: ${theme.background};
            margin: 0;
            padding: 20px 0;
        }
        
        /* Email container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, ${theme.primary} 0%, #0056b3 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin: 0;
        }
        
        .security-icon {
            font-size: 48px;
            margin: 15px 0 10px 0;
            display: block;
        }
        
        /* Content */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: ${theme.text};
            margin-bottom: 20px;
            text-align: center;
        }
        
        .intro-text {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.7;
            text-align: center;
            color: ${theme.textLight};
        }
        
        /* OTP Display */
        .otp-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 3px dashed ${theme.primary};
            border-radius: 15px;
            padding: 40px 20px;
            margin: 30px 0;
            text-align: center;
            position: relative;
        }
        
        .otp-container::before {
            content: '🔐';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background-color: white;
            padding: 0 10px;
            font-size: 24px;
        }
        
        .otp-label {
            font-size: 14px;
            color: ${theme.textLight};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 800;
            color: ${theme.primary};
            letter-spacing: 8px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            background-color: white;
            padding: 20px 30px;
            border-radius: 10px;
            border: 2px solid ${theme.primary}20;
            margin: 15px 0;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        }
        
        .otp-note {
            font-size: 13px;
            color: ${theme.textLight};
            margin-top: 15px;
            font-style: italic;
        }
        
        /* Instructions */
        .instructions {
            background-color: #f8f9fa;
            border-left: 4px solid ${theme.primary};
            padding: 25px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .instructions h3 {
            color: ${theme.primary};
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .instructions h3::before {
            content: '📝';
            font-size: 20px;
        }
        
        .instructions ol {
            margin-left: 20px;
            color: ${theme.text};
        }
        
        .instructions li {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        /* Expiry warning */
        .expiry-warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        
        .expiry-warning .icon {
            font-size: 24px;
            margin-bottom: 10px;
            display: block;
        }
        
        .expiry-warning h4 {
            color: #856404;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .expiry-warning p {
            color: #856404;
            margin: 0;
            font-size: 14px;
        }
        
        .countdown {
            font-weight: 700;
            font-size: 18px;
            color: ${theme.danger};
        }
        
        /* Security notice */
        .security-notice {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .security-notice h4 {
            color: #0c5460;
            margin-bottom: 10px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .security-notice h4::before {
            content: '🛡️';
        }
        
        .security-notice ul {
            color: #0c5460;
            margin-left: 20px;
            font-size: 14px;
        }
        
        .security-notice li {
            margin-bottom: 5px;
        }
        
        /* Footer */
        .footer {
            background-color: #f8f9fa;
            padding: 25px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: ${theme.textLight};
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
        }
        
        .contact-info a {
            color: ${theme.primary};
            text-decoration: none;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            
            .content {
                padding: 30px 20px !important;
            }
            
            .otp-code {
                font-size: 28px !important;
                letter-spacing: 4px !important;
                padding: 15px 20px !important;
            }
            
            .otp-container {
                padding: 30px 15px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                ${logoUrl ? `<img src="${logoUrl}" alt="${companyName} Logo" class="logo">` : ''}
                <span class="security-icon">🔒</span>
                <h1>Verification Code</h1>
                <p class="subtitle">Secure ${purpose} for your account</p>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                ${userName ? `Hello ${userName}!` : 'Hello!'}
            </div>
            
            <div class="intro-text">
                <p>We received a request for ${purpose} on your ${companyName} account. To proceed, please use the verification code below:</p>
            </div>
            
            <!-- OTP Display -->
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-note">Enter this code exactly as shown above</div>
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
                <h3>How to use this code:</h3>
                <ol>
                    <li>Return to the ${companyName} application or website</li>
                    <li>Enter the verification code: <strong>${otp}</strong></li>
                    <li>Click "Verify" or "Submit" to complete the process</li>
                    <li>You will be redirected to continue with your ${purpose}</li>
                </ol>
            </div>
            
            <!-- Expiry Warning -->
            <div class="expiry-warning">
                <span class="icon">⏰</span>
                <h4>Time Sensitive</h4>
                <p>This verification code will expire in <span class="countdown">${expiryMinutes} minutes</span></p>
                <p>Please use it as soon as possible to avoid having to request a new code.</p>
            </div>
            
            <!-- Security Notice -->
            <div class="security-notice">
                <h4>Security Reminder</h4>
                <ul>
                    <li>Never share this code with anyone</li>
                    <li>We will never ask for this code via phone or email</li>
                    <li>If you didn't request this code, please ignore this email</li>
                    <li>Contact support if you suspect suspicious activity</li>
                </ul>
            </div>
            
            <div class="intro-text" style="margin-top: 30px;">
                <p>If you're having trouble with verification, please contact our support team for assistance.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Keeping your account secure</p>
            
            <div class="contact-info">
                <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                <p style="font-size: 12px; margin-top: 10px;">This email was sent to ${email}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

export default otpSendingEmail;

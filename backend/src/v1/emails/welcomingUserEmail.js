/**
 * Generates a dynamic HTML welcome email template
 * @param {Object} options - Email template options
 * @param {string} options.userName - User's name
 * @param {string} [options.userEmail] - User's email address
 * @param {string} [options.companyName] - Company name (default: E-Commerce Express)
 * @param {string} [options.logoUrl] - Company logo URL
 * @param {string} [options.websiteUrl] - Website URL
 * @param {string} [options.supportEmail] - Support email address
 * @param {Array} [options.features] - List of features to highlight
 * @returns {string} HTML email template
 */
const welcomingUserEmail = (options = {}) => {
  const {
    userName = 'Valued Customer',
    userEmail = '',
    companyName = 'E-Commerce Express',
    logoUrl = '',
    websiteUrl = '#',
    supportEmail = 'support@ecommerce-express.com',

    features = [
      'Browse our extensive product catalog',
      'Add items to your personal wishlist',
      'Enjoy secure and fast checkout',
      'Track your orders in real-time',
      'Access exclusive member deals',
      'Get personalized product recommendations',
    ],
  } = options;

  const theme = {
    primary: '#007bff',
    secondary: '#6c757d',
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
    <title>Welcome to ${companyName}!</title>
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
            padding: 0;
        }
        
        /* Email container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, ${theme.primary} 0%, #0056b3 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        
        /* Content */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: ${theme.primary};
            margin-bottom: 20px;
        }
        
        .welcome-text {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        /* Features section */
        .features-section {
            margin: 30px 0;
        }
        
        .features-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: ${theme.text};
        }
        
        .features-list {
            list-style: none;
            padding: 0;
        }
        
        .features-list li {
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            font-size: 15px;
        }
        
        .features-list li:last-child {
            border-bottom: none;
        }
        
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: ${theme.primary};
            border-radius: 50%;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .feature-icon::after {
            content: '✓';
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        
        /* CTA Button */
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${theme.primary} 0%, #0056b3 100%);
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
        }
        
        /* Info box */
        .info-box {
            background-color: ${theme.background};
            border-left: 4px solid ${theme.primary};
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .info-box h3 {
            color: ${theme.primary};
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .info-box p {
            margin: 0;
            color: ${theme.textLight};
        }
        
        /* Footer */
        .footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: ${theme.textLight};
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: ${theme.textLight};
            text-decoration: none;
        }
        
        .contact-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .header, .content, .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .greeting {
                font-size: 20px !important;
            }
            
            .cta-button {
                padding: 12px 25px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName} Logo" class="logo">` : ''}
            <h1>Welcome to ${companyName}!</h1>
            <p>Your journey to amazing shopping starts here</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello ${userName}! 👋</div>
            
            <div class="welcome-text">
                <p>We're absolutely thrilled to welcome you to the ${companyName} family! Thank you for creating your account with us.</p>
                <p>Get ready to discover an incredible world of products, unbeatable deals, and exceptional service that's tailored just for you.</p>
            </div>
            
            <!-- Features Section -->
            <div class="features-section">
                <h2 class="features-title">What you can do now:</h2>
                <ul class="features-list">
                    ${features
                      .map(
                        feature => `
                        <li>
                            <div class="feature-icon"></div>
                            ${feature}
                        </li>
                    `,
                      )
                      .join('')}
                </ul>
            </div>
            
            <!-- CTA Button -->
            <div class="cta-section">
                <a href="${websiteUrl}" class="cta-button">Start Shopping Now</a>
            </div>
            
            <!-- Info Box -->
            <div class="info-box">
                <h3>🎉 Special Welcome Offer!</h3>
                <p>As a new member, you'll receive exclusive access to member-only deals and early notifications about sales and new arrivals.</p>
            </div>
            
            <div class="welcome-text">
                <p>If you have any questions or need assistance, our friendly customer support team is here to help. Don't hesitate to reach out!</p>
                <p>Once again, welcome aboard! We can't wait to serve you.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Your trusted shopping destination</p>
            
            <div class="social-links">
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
                <a href="#">LinkedIn</a>
            </div>
            
            <div class="contact-info">
                <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: ${theme.primary};">${supportEmail}</a></p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                ${userEmail ? `<p style="font-size: 12px; margin-top: 15px;">This email was sent to ${userEmail}</p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

export default welcomingUserEmail;

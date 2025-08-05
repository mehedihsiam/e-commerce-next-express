/**
 * Generates a dynamic HTML welcome email template for moderators
 * @param {Object} options - Email template options
 * @param {string} options.moderatorName - Moderator's name
 * @param {string} [options.moderatorEmail] - Moderator's email address
 * @param {string} [options.moderatorPassword] - Moderator's password (one-time)
 * @param {string} [options.companyName] - Company name (default: E-Commerce Express)
 * @param {string} [options.logoUrl] - Company logo URL
 * @param {string} [options.adminPanelUrl] - Admin panel URL
 * @param {string} [options.supportEmail] - Support email address
 * @param {string} [options.assignedBy] - Name of person who assigned moderator role
 * @param {Object} [options.theme] - Theme colors
 * @param {string} [options.theme.primary] - Primary color (default: #6f42c1)
 * @param {string} [options.theme.secondary] - Secondary color (default: #495057)
 * @param {string} [options.theme.accent] - Accent color (default: #ffc107)
 * @param {Array} [options.responsibilities] - List of moderator responsibilities
 * @param {Array} [options.resources] - List of helpful resources
 * @returns {string} HTML email template for moderators
 */
const welcomingModeratorEmail = (options = {}) => {
  const {
    moderatorName = 'Moderator',
    moderatorEmail = '',
    moderatorPassword = '',
    companyName = 'E-Commerce Express',
    logoUrl = '',
    adminPanelUrl = '#',
    supportEmail = 'admin@ecommerce-express.com',
    assignedBy = 'Admin Team',

    responsibilities = [
      'Review and moderate user-generated content',
      'Manage product listings and descriptions',
      'Handle customer disputes and complaints',
      'Monitor and enforce community guidelines',
      'Assist with order management and processing',
      'Generate reports on platform activity',
      'Coordinate with the admin team on policy updates',
    ],
    resources = [
      'Moderator Guidelines & Best Practices',
      'Platform Navigation Tutorial',
      'Customer Service Protocols',
      'Escalation Procedures Manual',
      'Monthly Performance Metrics Dashboard',
      'Team Communication Channels',
    ],
  } = options;
  const theme = {
    primary: '#6f42c1',
    secondary: '#495057',
    accent: '#ffc107',
    background: '#f8f9fa',
    text: '#212529',
    textLight: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to the ${companyName} Moderator Team!</title>
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
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, ${theme.primary} 0%, #5a2d91 100%);
            padding: 40px 30px;
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
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
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
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        
        .moderator-badge {
            display: inline-block;
            background-color: ${theme.accent};
            color: ${theme.text};
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            margin-bottom: 25px;
            line-height: 1.7;
        }
        
        /* Role info box */
        .role-info {
            background: linear-gradient(135deg, ${theme.primary}15 0%, ${theme.accent}15 100%);
            border: 2px solid ${theme.primary}30;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .role-info h3 {
            color: ${theme.primary};
            margin-bottom: 15px;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .role-info h3::before {
            content: '🛡️';
            font-size: 24px;
        }
        
        /* Responsibilities section */
        .section {
            margin: 35px 0;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: ${theme.text};
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .responsibilities-list, .resources-list {
            list-style: none;
            padding: 0;
        }
        
        .responsibilities-list li, .resources-list li {
            padding: 15px 20px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid ${theme.primary};
            border-radius: 0 8px 8px 0;
            display: flex;
            align-items: flex-start;
            font-size: 15px;
            transition: all 0.2s ease;
        }
        
        .responsibilities-list li:hover, .resources-list li:hover {
            background-color: #e9ecef;
            transform: translateX(5px);
        }
        
        .responsibilities-list li::before {
            content: '⚡';
            margin-right: 12px;
            color: ${theme.primary};
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .resources-list li::before {
            content: '📚';
            margin-right: 12px;
            color: ${theme.accent};
            font-size: 16px;
            flex-shrink: 0;
        }
        
        /* CTA Buttons */
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-primary {
            display: inline-block;
            background: linear-gradient(135deg, ${theme.primary} 0%, #5a2d91 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);
        }
        
        .cta-secondary {
            display: inline-block;
            background-color: transparent;
            color: ${theme.primary};
            border: 2px solid ${theme.primary};
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
        }
        
        .cta-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(111, 66, 193, 0.4);
        }
        
        .cta-secondary:hover {
            background-color: ${theme.primary};
            color: white;
        }
        
        /* Important notice */
        .notice-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .notice-box h4 {
            color: #856404;
            margin-bottom: 10px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .notice-box h4::before {
            content: '⚠️';
        }
        
        .notice-box p {
            color: #856404;
            margin: 0;
            font-size: 14px;
        }
        
        /* Stats cards */
        .stats-section {
            display: flex;
            gap: 15px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .stat-card {
            flex: 1;
            min-width: 150px;
            background: linear-gradient(135deg, ${theme.primary} 0%, #5a2d91 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
        
        .contact-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            
            .header, .content, .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            
            .stats-section {
                flex-direction: column;
            }
            
            .cta-primary, .cta-secondary {
                display: block;
                margin: 10px 0;
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
                <h1>Welcome to the Team!</h1>
                <p class="subtitle">You've been granted moderator privileges</p>
                <div class="moderator-badge">Moderator Access Granted</div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">Welcome, ${moderatorName}! 🎉</div>
            
            <div class="welcome-text">
                <p>Congratulations! You have been appointed as a moderator for ${companyName} by ${assignedBy}. We're excited to have you join our moderation team and help us maintain the high standards our platform is known for.</p>
                <p>As a moderator, you play a crucial role in ensuring our community remains safe, productive, and enjoyable for all users.</p>
            </div>
            
            <!-- Role Info -->
            <div class="role-info">
                <h3>Your New Role</h3>
                <p><strong>Position:</strong> Platform Moderator</p>
                <p><strong>Access Level:</strong> Moderator Privileges</p>
                <p><strong>Assigned By:</strong> ${assignedBy}</p>
                <p><strong>Start Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <!-- Quick Stats -->
            <div class="stats-section">
                <div class="stat-card">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Support Available</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">100+</div>
                    <div class="stat-label">Moderation Tools</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">∞</div>
                    <div class="stat-label">Learning Resources</div>
                </div>
            </div>
            
            <!-- Responsibilities -->
            <div class="section">
                <h2 class="section-title">
                    🎯 Your Key Responsibilities
                </h2>
                <ul class="responsibilities-list">
                    ${responsibilities
                      .map(
                        responsibility => `
                        <li>${responsibility}</li>
                    `,
                      )
                      .join('')}
                </ul>
            </div>
            
            <!-- Resources -->
            <div class="section">
                <h2 class="section-title">
                    📖 Helpful Resources
                </h2>
                <ul class="resources-list">
                    ${resources
                      .map(
                        resource => `
                        <li>${resource}</li>
                    `,
                      )
                      .join('')}
                </ul>
            </div>
            
            <!-- CTA Section -->
            <div class="cta-section">
                <a href="${adminPanelUrl}" class="cta-primary">Access Admin Panel</a>
                <a href="#" class="cta-secondary">View Guidelines</a>
            </div>
            
            <!-- Important Notice -->
            <div class="notice-box">
                <h4>Important Security Notice</h4>
                <p>Your moderator credentials are confidential. Never share your login details or access tokens with anyone. If you suspect your account has been compromised, contact the admin team immediately.</p>
            </div>
            
            <div class="welcome-text">
                <p><strong>Getting Started:</strong> We recommend starting by familiarizing yourself with our moderation guidelines and exploring the admin panel. If you have any questions, don't hesitate to reach out to our admin team.</p>
                <p>Thank you for accepting this responsibility. We're confident you'll make a valuable contribution to our platform's success!</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName} - Moderation Team</strong></p>
            <p>Maintaining excellence through dedicated moderation</p>
            <p>Your Credentials</p>
            <p>Email: ${moderatorEmail}</p>
            <p>Password (One time): ${moderatorPassword}</p>


            
            <div class="contact-info">
                <p>Questions or concerns? Contact the admin team at <a href="mailto:${supportEmail}" style="color: ${theme.primary};">${supportEmail}</a></p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                ${moderatorEmail ? `<p style="font-size: 12px; margin-top: 15px;">This email was sent to ${moderatorEmail}</p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

export default welcomingModeratorEmail;

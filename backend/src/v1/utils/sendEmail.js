import nodemailer from 'nodemailer';
import { z } from 'zod';

// Email validation schema
const emailSchema = z
  .object({
    to: z.union([
      z.string().email('Invalid email address'),
      z
        .array(z.string().email('Invalid email address'))
        .min(1, 'At least one recipient required'),
    ]),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .max(200, 'Subject too long'),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z
      .union([
        z.string().email('Invalid CC email address'),
        z.array(z.string().email('Invalid CC email address')),
      ])
      .optional(),
    bcc: z
      .union([
        z.string().email('Invalid BCC email address'),
        z.array(z.string().email('Invalid BCC email address')),
      ])
      .optional(),
  })
  .refine(data => data.text || data.html, {
    message: 'Either text or html content is required',
    path: ['content'],
  });

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: parseInt(process.env.NODEMAILER_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw new Error('Email service configuration error');
  }
};

/**
 * Sends an email using nodemailer
 * @param {Object} emailOptions - Email configuration object
 * @param {string|string[]} emailOptions.to - Recipient email address(es)
 * @param {string} emailOptions.subject - Email subject
 * @param {string} [emailOptions.text] - Plain text body
 * @param {string} [emailOptions.html] - HTML body
 * @param {string|string[]} [emailOptions.cc] - CC recipients
 * @param {string|string[]} [emailOptions.bcc] - BCC recipients
 * @returns {Promise<Object>} Email send result
 */
const sendEmail = async emailOptions => {
  try {
    // Validate email options
    const validatedOptions = emailSchema.parse(emailOptions);

    // Create transporter
    const transporter = createTransporter();

    // Email message configuration
    const mailOptions = {
      from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER,
      to: Array.isArray(validatedOptions.to)
        ? validatedOptions.to.join(', ')
        : validatedOptions.to,
      subject: validatedOptions.subject,
      text: validatedOptions.text,
      html: validatedOptions.html,
    };

    // Add optional fields if provided
    if (validatedOptions.cc) {
      mailOptions.cc = Array.isArray(validatedOptions.cc)
        ? validatedOptions.cc.join(', ')
        : validatedOptions.cc;
    }

    if (validatedOptions.bcc) {
      mailOptions.bcc = Array.isArray(validatedOptions.bcc)
        ? validatedOptions.bcc.join(', ')
        : validatedOptions.bcc;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error('Email sending failed:', error);

    if (error instanceof z.ZodError) {
      throw new Error(
        `Email validation failed: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
};
export default sendEmail;

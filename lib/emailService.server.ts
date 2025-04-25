// This file will only be imported by server components or API routes
import nodemailer from 'nodemailer';

// Configure email transporter for Resend
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email templates with Resend-friendly HTML
const emailTemplates = {
  orderConfirmation: (data: any) => ({
    subject: `Order Confirmation #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmation</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>Thank you for your order! We're processing it now and will ship it soon.</p>
              <h2 style="color: #DA0988; font-size: 20px; margin-top: 30px;">Order #${data.orderId}</h2>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Total:</strong> ${data.total}</p>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #eee;">Product</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #eee;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #eee;">Price</th>
                </tr>
                ${data.items.map((item: any) => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #eee;">${item.price}</td>
                  </tr>
                `).join('')}
              </table>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin-top: 0; font-weight: bold;">Shipping to:</p>
                <p style="margin-top: 5px;">
                  ${data.shippingAddress.name}<br>
                  ${data.shippingAddress.address}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state}
                </p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.orderUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order Details</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  shippingConfirmation: (data: any) => ({
    subject: `Your Order #${data.orderId} Has Shipped!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Shipped</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Order Has Shipped!</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>Great news! Your order is on its way to you.</p>
              <h2 style="color: #DA0988; font-size: 20px; margin-top: 30px;">Order #${data.orderId}</h2>
              
              <div style="background-color: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #eee;">
                <p style="margin-top: 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p style="margin-bottom: 0;"><strong>Carrier:</strong> ${data.carrier}</p>
                <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
                <p style="margin-bottom: 0;"><a href="${data.trackingUrl}" style="color: #DA0988; font-weight: bold;">Track Your Package</a></p>
              </div>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
              <ul style="padding-left: 20px;">
                ${data.items.map((item: any) => `<li style="margin: 10px 0;">${item.quantity} x ${item.name}</li>`).join('')}
              </ul>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.orderUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order Details</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  welcomeEmail: (data: any) => ({
    subject: `Welcome to Midessories!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to Midessories</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Midessories!</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.firstName},</p>
              <p>Thank you for creating an account with Midessories! We're excited to have you join our community.</p>
              
              <p>With your new account, you can:</p>
              <ul style="padding-left: 20px;">
                <li style="margin: 10px 0;">Track your orders</li>
                <li style="margin: 10px 0;">Save your favorite items</li>
                <li style="margin: 10px 0;">Get personalized recommendations</li>
                <li style="margin: 10px 0;">Checkout faster</li>
              </ul>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.shopUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Shopping</a>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our customer support team.</p>
              
              <p>Happy shopping!</p>
              <p>The Midessories Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
              <p>You're receiving this email because you recently created an account on our website.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  passwordReset: (data: any) => ({
    subject: `Reset Your Midessories Password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${data.resetUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              
              <p>This link will expire in 1 hour for security reasons.</p>
              
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  abandonedCart: (data: any) => ({
    subject: `Complete Your Purchase at Midessories`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Your Cart is Waiting</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Cart is Waiting!</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>We noticed you left some items in your shopping cart. Don't worry, we've saved them for you!</p>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Your Cart Items:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #eee;">Product</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #eee;">Price</th>
                </tr>
                ${data.items.map((item: any) => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #eee;">${item.price}</td>
                  </tr>
                `).join('')}
              </table>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.cartUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Complete Your Purchase</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  transferOrder: (data: any) => ({
    subject: `Your Order #${data.orderId} - Bank Transfer Details`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Bank Transfer Details</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Order Has Been Received</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>Thank you for your order. Please complete your payment using the bank details below.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #DA0988;">Bank Transfer Details</h3>
                <p><strong>Bank Name:</strong> ${data.bankDetails.bank}</p>
                <p><strong>Account Number:</strong> ${data.bankDetails.accountNumber}</p>
                <p><strong>Account Name:</strong> ${data.bankDetails.accountName}</p>
                <p><strong>Reference:</strong> ${data.orderId}</p>
              </div>
              
              <p style="color: #DA0988; font-weight: bold;">Important: Please use your order number as payment reference.</p>
              <p>Your order will be processed once we confirm your payment.</p>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
              <p><strong>Order Number:</strong> ${data.orderId}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Total:</strong> ${data.total}</p>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Items</h3>
              <ul style="padding-left: 20px;">
                ${data.items.map((item: any) => `<li style="margin: 10px 0;">${item.quantity} x ${item.name} - ${item.price}</li>`).join('')}
              </ul>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Shipping Address</h3>
              <p>${data.shippingAddress.name}<br>
              ${data.shippingAddress.address}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.state}</p>
              
              <div style="margin-top: 40px; text-align: center;">
                <a href="${data.orderUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order Details</a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  orderDelivered: (data: any) => ({
    subject: `Your Order #${data.orderId} Has Been Delivered!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Delivered</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Order Has Been Delivered!</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>Great news! Your order has been delivered. We hope you love your new items!</p>
              <h2 style="color: #DA0988; font-size: 20px; margin-top: 30px;">Order #${data.orderId}</h2>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
              <ul style="padding-left: 20px;">
                ${data.items.map((item: any) => `<li style="margin: 10px 0;">${item.quantity} x ${item.name}</li>`).join('')}
              </ul>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.reviewUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-bottom: 15px;">Leave a Review</a>
                <br>
                <a href="${data.orderUrl}" style="color: #DA0988; text-decoration: underline;">View Order Details</a>
              </div>
              
              <p style="margin-top: 30px;">Thank you for shopping with Midessories!</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  orderCanceled: (data: any) => ({
    subject: `Your Order #${data.orderId} Has Been Canceled`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Canceled</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Order Has Been Canceled</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>We're writing to inform you that your order has been canceled.</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #eee;">
                <p style="margin-top: 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p><strong>Reason for Cancellation:</strong> ${data.cancellationReason}</p>
                ${data.refundAmount !== 'N/A' ? `<p style="margin-bottom: 0;"><strong>Refund Amount:</strong> ${data.refundAmount}</p>` : ''}
              </div>
              
              <h3 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #eee;">Product</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #eee;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #eee;">Price</th>
                </tr>
                ${data.items.map((item: any) => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #eee;">${item.price}</td>
                  </tr>
                `).join('')}
              </table>
              
              <p style="margin-top: 30px;">If you have any questions about this cancellation, please contact our customer support team at ${data.supportEmail}.</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  refundProcessed: (data: any) => ({
    subject: `Refund Processed for Order #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Refund Processed</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DA0988; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Refund Has Been Processed</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; background-color: #fff; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Hello ${data.customerName},</p>
              <p>We're writing to confirm that we've processed a refund for your order.</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #eee;">
                <p style="margin-top: 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p><strong>Refund Amount:</strong> ${data.refundAmount}</p>
                <p><strong>Refund Date:</strong> ${data.date}</p>
                <p style="margin-bottom: 0;"><strong>Reason:</strong> ${data.refundReason}</p>
              </div>
              
              <p>The refund has been processed to your original payment method. Depending on your bank or payment provider, it may take 5-10 business days for the refund to appear in your account.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.orderUrl}" style="background-color: #DA0988; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order Details</a>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions about this refund, please don't hesitate to contact our customer support team.</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Midessories. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Main function to send emails
export async function sendEmail(
  to: string,
  templateName: keyof typeof emailTemplates,
  data: any
) {
  try {
    const template = emailTemplates[templateName](data);
    
    const mailOptions = {
      from: `"Midessories" <${process.env.EMAIL_FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 
/**
 * Simplified email service - just logs emails instead of sending them
 * Remove email functionality entirely in production
 */

const sendEmail = async (options) => {
  console.log('Email would be sent:', {
    to: options.email,
    subject: options.subject,
    message: options.message,
    timestamp: new Date().toISOString()
  });
  
  return true;
};

const sendWelcomeEmail = async (user) => {
  const message = `
    Welcome to AgroForms, ${user.name}!
    
    Your account has been successfully created.
    Email: ${user.email}
    Role: ${user.role}
    
    You can now start using our platform to connect with farmers/buyers.
    
    Best regards,
    AgroForms Team
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Welcome to AgroForms',
    message
  });
};

const sendOrderConfirmation = async (order, buyer) => {
  const message = `
    Order Confirmed!
    
    Order ID: ${order.orderId}
    Total Amount: ₹${order.totalAmount}
    Status: ${order.status}
    
    Your order has been placed successfully and is waiting for farmer approval.
    
    You can track your order in your dashboard.
    
    Thank you for shopping with AgroForms!
  `;

  return await sendEmail({
    email: buyer.email,
    subject: `Order Confirmation - ${order.orderId}`,
    message
  });
};

const sendOrderStatusUpdate = async (order, user, status) => {
  const message = `
    Order Status Updated
    
    Order ID: ${order.orderId}
    New Status: ${status}
    
    ${status === 'confirmed' ? 'The farmer has confirmed your order.' : ''}
    ${status === 'processing' ? 'The farmer is preparing your order.' : ''}
    ${status === 'ready_for_delivery' ? 'Your order is ready for delivery.' : ''}
    ${status === 'delivered' ? 'Your order has been delivered.' : ''}
    ${status === 'cancelled' ? 'Your order has been cancelled.' : ''}
    
    Please check your dashboard for more details.
  `;

  return await sendEmail({
    email: user.email,
    subject: `Order Update - ${order.orderId}`,
    message
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate
};
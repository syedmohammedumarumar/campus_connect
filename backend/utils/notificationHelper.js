const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create connection request notification
 * @param {String} userId - Receiver's user ID
 * @param {Object} sender - Sender's user object
 * @param {String} connectionId - Connection ID
 */
const notifyConnectionRequest = async (userId, sender, connectionId) => {
  return createNotification({
    userId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: `${sender.name} (${sender.rollNumber}) sent you a connection request`,
    relatedId: connectionId,
    relatedModel: 'Connection'
  });
};

/**
 * Create connection accepted notification
 * @param {String} userId - Sender's user ID
 * @param {Object} accepter - Person who accepted the request
 * @param {String} connectionId - Connection ID
 */
const notifyConnectionAccepted = async (userId, accepter, connectionId) => {
  return createNotification({
    userId,
    type: 'connection_accepted',
    title: 'Connection Request Accepted',
    message: `${accepter.name} (${accepter.rollNumber}) accepted your connection request`,
    relatedId: connectionId,
    relatedModel: 'Connection'
  });
};

/**
 * Create connection rejected notification
 * @param {String} userId - Sender's user ID
 * @param {Object} rejecter - Person who rejected the request
 * @param {String} connectionId - Connection ID
 */
const notifyConnectionRejected = async (userId, rejecter, connectionId) => {
  return createNotification({
    userId,
    type: 'connection_rejected',
    title: 'Connection Request Declined',
    message: `${rejecter.name} declined your connection request`,
    relatedId: connectionId,
    relatedModel: 'Connection'
  });
};

module.exports = {
  createNotification,
  notifyConnectionRequest,
  notifyConnectionAccepted,
  notifyConnectionRejected
};
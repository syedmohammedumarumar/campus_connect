const Connection = require('../models/Connection');
const User = require('../models/User');
const PrivacySetting = require('../models/PrivacySetting');
const {
  notifyConnectionRequest,
  notifyConnectionAccepted,
  notifyConnectionRejected
} = require('../utils/notificationHelper');

// Send Connection Request
exports.sendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;
    const { message } = req.body;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is trying to connect with themselves
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send connection request to yourself'
      });
    }

    // Check receiver's privacy settings
    const privacySettings = await PrivacySetting.findOne({ userId: receiverId });
    if (privacySettings && !privacySettings.allowConnectionRequests) {
      return res.status(403).json({
        success: false,
        message: 'This user is not accepting connection requests'
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingConnection) {
      let message = 'Connection request already exists';
      if (existingConnection.status === 'accepted') {
        message = 'You are already connected';
      } else if (existingConnection.status === 'pending') {
        message = existingConnection.senderId.toString() === senderId
          ? 'Connection request already sent'
          : 'This user has already sent you a connection request';
      } else if (existingConnection.status === 'blocked') {
        message = 'Cannot send connection request';
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    // Create connection request
    const connection = await Connection.create({
      senderId,
      receiverId,
      message: message || '',
      status: 'pending'
    });

    // Send notification to receiver
    const sender = await User.findById(senderId).select('name rollNumber');
    await notifyConnectionRequest(receiverId, sender, connection._id);

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: {
        connection: {
          _id: connection._id,
          receiverId: connection.receiverId,
          status: connection.status,
          message: connection.message,
          requestedAt: connection.requestedAt
        }
      }
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send connection request',
      error: error.message
    });
  }
};

// Accept Connection Request
exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Verify user is the receiver
    if (connection.receiverId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    // Check if already accepted
    if (connection.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Connection request already accepted'
      });
    }

    // Check if request is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is no longer pending'
      });
    }

    // Update connection status
    connection.status = 'accepted';
    connection.respondedAt = Date.now();
    await connection.save();

    // Send notification to sender
    const accepter = await User.findById(userId).select('name rollNumber');
    await notifyConnectionAccepted(connection.senderId, accepter, connection._id);

    // Populate sender info for response
    await connection.populate('senderId', 'name rollNumber branch year profilePicture');

    res.json({
      success: true,
      message: 'Connection request accepted',
      data: {
        connection: {
          _id: connection._id,
          sender: connection.senderId,
          status: connection.status,
          respondedAt: connection.respondedAt
        }
      }
    });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept connection request',
      error: error.message
    });
  }
};

// Reject Connection Request
exports.rejectRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Verify user is the receiver
    if (connection.receiverId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    // Check if request is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is no longer pending'
      });
    }

    // Update connection status
    connection.status = 'rejected';
    connection.respondedAt = Date.now();
    await connection.save();

    // Send notification to sender
    const rejecter = await User.findById(userId).select('name rollNumber');
    await notifyConnectionRejected(connection.senderId, rejecter, connection._id);

    res.json({
      success: true,
      message: 'Connection request rejected'
    });
  } catch (error) {
    console.error('Reject connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject connection request',
      error: error.message
    });
  }
};

// Remove Connection
exports.removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Verify user is part of this connection
    const isParticipant = 
      connection.senderId.toString() === userId ||
      connection.receiverId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this connection'
      });
    }

    // Only remove if connection is accepted
    if (connection.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only remove accepted connections'
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove connection',
      error: error.message
    });
  }
};

// Get My Connections
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all accepted connections where user is either sender or receiver
    const connections = await Connection.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    })
      .populate('senderId', 'name rollNumber branch year profilePicture bio skills interests')
      .populate('receiverId', 'name rollNumber branch year profilePicture bio skills interests')
      .sort({ respondedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total connections
    const total = await Connection.countDocuments({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    });

    // Format connections to show the other user
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.senderId._id.toString() === userId
        ? conn.receiverId
        : conn.senderId;

      return {
        _id: conn._id,
        user: otherUser,
        connectedAt: conn.respondedAt
      };
    });

    res.json({
      success: true,
      data: {
        connections: formattedConnections,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
};

// Get Pending Requests (Incoming)
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const requests = await Connection.find({
      receiverId: userId,
      status: 'pending'
    })
      .populate('senderId', 'name rollNumber branch year profilePicture bio')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Connection.countDocuments({
      receiverId: userId,
      status: 'pending'
    });

    const formattedRequests = requests.map(req => ({
      _id: req._id,
      sender: req.senderId,
      message: req.message,
      requestedAt: req.requestedAt
    }));

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
};

// Get Sent Requests
exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const requests = await Connection.find({
      senderId: userId,
      status: 'pending'
    })
      .populate('receiverId', 'name rollNumber branch year profilePicture bio')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Connection.countDocuments({
      senderId: userId,
      status: 'pending'
    });

    const formattedRequests = requests.map(req => ({
      _id: req._id,
      receiver: req.receiverId,
      message: req.message,
      requestedAt: req.requestedAt
    }));

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent requests',
      error: error.message
    });
  }
};

// Get Connection Suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get current user's data
    const currentUser = await User.findById(userId)
      .select('branch year skills interests');

    // Get existing connections and requests
    const existingConnections = await Connection.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).select('senderId receiverId');

    // Extract user IDs to exclude
    const excludeIds = [userId];
    existingConnections.forEach(conn => {
      if (conn.senderId.toString() !== userId) {
        excludeIds.push(conn.senderId.toString());
      }
      if (conn.receiverId.toString() !== userId) {
        excludeIds.push(conn.receiverId.toString());
      }
    });

    // Find suggested users based on:
    // 1. Same branch and year (highest priority)
    // 2. Common skills or interests
    // 3. Same branch but different year
    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludeIds.map(id => require('mongoose').Types.ObjectId(id)) },
          accountStatus: 'active',
          verified: true
        }
      },
      {
        $addFields: {
          matchScore: {
            $add: [
              // Same branch and year: 10 points
              {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$branch', currentUser.branch] },
                      { $eq: ['$year', currentUser.year] }
                    ]
                  },
                  10,
                  0
                ]
              },
              // Same branch: 5 points
              {
                $cond: [
                  { $eq: ['$branch', currentUser.branch] },
                  5,
                  0
                ]
              },
              // Common skills: 2 points each
              {
                $multiply: [
                  {
                    $size: {
                      $ifNull: [
                        {
                          $setIntersection: [
                            { $ifNull: ['$skills', []] },
                            currentUser.skills || []
                          ]
                        },
                        []
                      ]
                    }
                  },
                  2
                ]
              },
              // Common interests: 1 point each
              {
                $size: {
                  $ifNull: [
                    {
                      $setIntersection: [
                        { $ifNull: ['$interests', []] },
                        currentUser.interests || []
                      ]
                    },
                    []
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $match: {
          matchScore: { $gt: 0 }
        }
      },
      {
        $sort: { matchScore: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          rollNumber: 1,
          branch: 1,
          year: 1,
          profilePicture: 1,
          bio: 1,
          skills: 1,
          interests: 1,
          matchScore: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connection suggestions',
      error: error.message
    });
  }
};

// Get Mutual Connections
exports.getMutualConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    // Get current user's connections
    const myConnections = await Connection.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    });

    // Extract connection IDs
    const myConnectionIds = myConnections.map(conn => {
      return conn.senderId.toString() === userId
        ? conn.receiverId.toString()
        : conn.senderId.toString();
    });

    // Get target user's connections
    const targetConnections = await Connection.find({
      $or: [
        { senderId: targetUserId, status: 'accepted' },
        { receiverId: targetUserId, status: 'accepted' }
      ]
    });

    // Extract target's connection IDs
    const targetConnectionIds = targetConnections.map(conn => {
      return conn.senderId.toString() === targetUserId
        ? conn.receiverId.toString()
        : conn.senderId.toString();
    });

    // Find mutual connections
    const mutualConnectionIds = myConnectionIds.filter(id =>
      targetConnectionIds.includes(id)
    );

    // Get user details for mutual connections
    const mutualUsers = await User.find({
      _id: { $in: mutualConnectionIds }
    }).select('name rollNumber branch year profilePicture');

    res.json({
      success: true,
      data: {
        mutualConnections: mutualUsers,
        count: mutualUsers.length
      }
    });
  } catch (error) {
    console.error('Get mutual connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mutual connections',
      error: error.message
    });
  }
};
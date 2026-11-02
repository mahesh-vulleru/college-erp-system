const Notification = require('./notification.model');
const logger = require('../../utils/logger');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

/**
 * Default realistic event notifications by role
 */
function getSeedNotificationsForRole(role, userId) {
  const now = new Date();
  switch (role) {
    case ROLES.TRANSPORT_ADMIN:
      return [
        {
          recipient: userId,
          recipientRole: ROLES.TRANSPORT_ADMIN,
          category: 'Safety',
          title: 'Emergency SOS Broadcast (Resolved)',
          message: 'SOS Alert SOS-2026-001 on Bus 01 near Sector 12 was resolved by Emergency Team.',
          priority: 'urgent',
          read: false,
          link: '/transport?tab=safety'
        },
        {
          recipient: userId,
          recipientRole: ROLES.TRANSPORT_ADMIN,
          category: 'Transport',
          title: 'Daily Fleet Dispatch Update',
          message: 'Morning transit schedules dispatched: 14 buses active, 1 standby on Route 4.',
          priority: 'medium',
          read: false,
          link: '/transport?tab=trips'
        },
        {
          recipient: userId,
          recipientRole: ROLES.TRANSPORT_ADMIN,
          category: 'Grievance',
          title: 'New Transport Grievance Lodged',
          message: 'Parent Patel submitted ticket CMP-2026-001 regarding morning pickup delay at Sector 14.',
          priority: 'high',
          read: false,
          link: '/transport?tab=complaints'
        }
      ];
    case ROLES.TRANSPORT_SUPERVISOR:
      return [
        {
          recipient: userId,
          recipientRole: ROLES.TRANSPORT_SUPERVISOR,
          category: 'Safety',
          title: 'Corridor Geofence Alert',
          message: 'Bus 02 reported slight route deviation near Ring Road corridor.',
          priority: 'high',
          read: false,
          link: '/transport?tab=safety'
        },
        {
          recipient: userId,
          recipientRole: ROLES.TRANSPORT_SUPERVISOR,
          category: 'Transport',
          title: 'Student Boarding Attendance Ready',
          message: 'Morning attendance completed for Route 1 (94% boarded).',
          priority: 'medium',
          read: false,
          link: '/transport?tab=attendance'
        }
      ];
    case ROLES.BUS_DRIVER:
      return [
        {
          recipient: userId,
          recipientRole: ROLES.BUS_DRIVER,
          category: 'Transport',
          title: 'Evening Trip Schedule Assigned',
          message: 'Evening drop trip scheduled for 04:30 PM on Route 1 (Bus 01).',
          priority: 'medium',
          read: false,
          link: '/transport?tab=driver_portal'
        },
        {
          recipient: userId,
          recipientRole: ROLES.BUS_DRIVER,
          category: 'Safety',
          title: 'Weather Safety Advisory',
          message: 'Rain forecast in Sector 14 area. Maintain 40 km/h speed limit.',
          priority: 'high',
          read: false,
          link: '/transport?tab=driver_portal'
        }
      ];
    case ROLES.PARENT:
      return [
        {
          recipient: userId,
          recipientRole: ROLES.PARENT,
          category: 'Transport',
          title: 'Child Boarded School Bus',
          message: 'Aarav Sharma safely boarded Bus 01 at Sector 14 stop at 08:14 AM.',
          priority: 'medium',
          read: false,
          link: '/transport?tab=parent'
        },
        {
          recipient: userId,
          recipientRole: ROLES.PARENT,
          category: 'Fee',
          title: 'Transport Fee Receipt Generated',
          message: 'Receipt generated for Transport Fee installment AY 2025-26 (₹24,000 paid).',
          priority: 'low',
          read: true,
          link: '/transport?tab=parent'
        }
      ];
    case ROLES.STUDENT:
      return [
        {
          recipient: userId,
          recipientRole: ROLES.STUDENT,
          category: 'Event',
          title: 'Academic Calendar Announcement',
          message: 'Mid-term examinations scheduled to commence from 20th November 2026.',
          priority: 'medium',
          read: false,
          link: '/calendar'
        },
        {
          recipient: userId,
          recipientRole: ROLES.STUDENT,
          category: 'Transport',
          title: 'Bus Pass Active',
          message: 'Your campus transit allocation for Route 1 (Sector 14) is confirmed active.',
          priority: 'low',
          read: false,
          link: '/student'
        }
      ];
    case ROLES.SUPER_ADMIN:
    case ROLES.PRINCIPAL:
      return [
        {
          recipient: userId,
          recipientRole: role,
          category: 'System',
          title: 'Campus System Health Audit',
          message: 'Database backup and system diagnostics completed with 100% data integrity.',
          priority: 'low',
          read: false,
          link: '/admin'
        },
        {
          recipient: userId,
          recipientRole: role,
          category: 'Event',
          title: 'Annual Academic Council Meeting',
          message: 'Executive review scheduled for 15th Nov 2026 in Senate Chamber.',
          priority: 'high',
          read: false,
          link: '/calendar'
        }
      ];
    default:
      return [
        {
          recipient: userId,
          recipientRole: 'all',
          category: 'General',
          title: 'Welcome to Apex College ERP',
          message: 'Your institutional portal account is fully active and synchronized.',
          priority: 'low',
          read: false,
          link: '/dashboard'
        }
      ];
  }
}

/**
 * Fetch authenticated user notifications with accurate unread counts
 */
async function getNotifications(req, res, next) {
  try {
    const user = req.user;
    const { category, read, limit = 50 } = req.query;

    const baseQuery = {
      $or: [
        { recipient: user._id },
        { recipientRole: user.role },
        { recipientRole: 'all' }
      ]
    };

    // Check if notifications exist for this user or role; if not, seed realistic events
    const existingCount = await Notification.countDocuments(baseQuery);
    if (existingCount === 0) {
      const seedList = getSeedNotificationsForRole(user.role, user._id);
      await Notification.insertMany(seedList);
    }

    const query = { ...baseQuery };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(100, parseInt(limit, 10)))
        .lean(),
      Notification.countDocuments({
        ...baseQuery,
        read: false
      })
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
}

/**
 * Mark a single notification as read
 */
async function markNotificationRead(req, res, next) {
  try {
    const user = req.user;
    const notificationId = req.params.id;

    const notif = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        $or: [
          { recipient: user._id },
          { recipientRole: user.role },
          { recipientRole: 'all' }
        ]
      },
      {
        $set: { read: true, readAt: new Date() }
      },
      { new: true }
    );

    if (!notif) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found or access denied'
      });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [
        { recipient: user._id },
        { recipientRole: user.role },
        { recipientRole: 'all' }
      ],
      read: false
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification marked as read',
      data: notif,
      unreadCount
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
}

/**
 * Mark all notifications as read for current user
 */
async function markAllNotificationsRead(req, res, next) {
  try {
    const user = req.user;

    await Notification.updateMany(
      {
        $or: [
          { recipient: user._id },
          { recipientRole: user.role },
          { recipientRole: 'all' }
        ],
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
}

/**
 * Create a new notification (system or admin)
 */
async function createNotification(req, res, next) {
  try {
    const { recipient, recipientRole, category, title, message, priority, link, metadata } = req.body;

    if (!title || !message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const notif = await Notification.create({
      recipient: recipient || null,
      recipientRole: recipientRole || null,
      category: category || 'General',
      title,
      message,
      priority: priority || 'medium',
      link: link || null,
      metadata: metadata || null
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Notification created successfully',
      data: notif
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    next(error);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification
};

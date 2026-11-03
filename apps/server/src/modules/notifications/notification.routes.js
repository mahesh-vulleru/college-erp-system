const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification
} = require('./notification.controller');

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/read-all', markAllNotificationsRead);
router.post('/', createNotification);

module.exports = router;

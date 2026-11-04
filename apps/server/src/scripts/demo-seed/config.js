/**
 * Central Configuration for Realistic Demo Data Population
 * All generated records carry the DEMO_TAG or DEMO_PREFIX.
 */
const path = require('path');
const { ROLES, USER_STATUS } = require(path.resolve(__dirname, '../../../../../packages/shared'));

const DEMO_TAG = '[DEMO]';
const DEMO_PREFIX = 'DEMO-';
const DEMO_DOMAIN = 'demo.college.local';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoCollege#2026!';

const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE', intakeCapacity: 120, description: 'Department of Computer Science & Engineering' },
  { name: 'Electronics & Communication Engineering', code: 'ECE', intakeCapacity: 90, description: 'Department of Electronics & Communication' },
  { name: 'Mechanical Engineering', code: 'ME', intakeCapacity: 90, description: 'Department of Mechanical Engineering' },
  { name: 'Civil Engineering', code: 'CE', intakeCapacity: 60, description: 'Department of Civil Engineering' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE', intakeCapacity: 60, description: 'Department of Electrical & Electronics' }
];

module.exports = {
  DEMO_TAG,
  DEMO_PREFIX,
  DEMO_DOMAIN,
  DEMO_PASSWORD,
  DEPARTMENTS,
  ROLES,
  USER_STATUS
};


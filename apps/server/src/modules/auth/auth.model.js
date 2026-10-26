const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ALL_ROLES, ROLES, USER_STATUS } = require('@college-erp/shared');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Never return password hash in queries by default
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ALL_ROLES,
        message: 'Invalid role assigned: {VALUE}'
      },
      default: ROLES.STUDENT
    },
    department: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    isTemporaryPassword: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique index on email
userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// Safe presentation helper (never includes password)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    status: this.status,
    isTemporaryPassword: this.isTemporaryPassword,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;

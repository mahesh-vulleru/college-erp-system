const Goal = require('./goal.model');
const Department = require('../departments/department.model');
const User = require('../auth/auth.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * List Institutional Goals with Filtering, Progress Tracking, and Analytics
 */
async function listGoals(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status.toLowerCase();
    }

    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority.toLowerCase();
    }

    if (req.query.academicYear && req.query.academicYear !== 'all') {
      query.academicYear = req.query.academicYear;
    }

    if (req.query.semester && req.query.semester !== 'all') {
      query.semester = Number(req.query.semester);
    }

    if (req.query.department && req.query.department !== 'all') {
      if (req.query.department === 'institution_wide') {
        query.department = null;
      } else if (mongoose.Types.ObjectId.isValid(req.query.department)) {
        query.department = req.query.department;
      }
    }

    const search = req.query.search || req.query.q;
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    let allGoals = [];
    try {
      allGoals = await Goal.find(query)
        .populate('department', 'name code')
        .populate('owner', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ priority: 1, deadline: 1 })
        .lean();
    } catch (e) {
      allGoals = [];
    }

    const now = new Date();

    let completedCount = 0;
    let inProgressCount = 0;
    let atRiskOrOverdueCount = 0;
    let totalPercentageSum = 0;

    const categoryMap = {};
    const departmentMap = {};

    const updatedGoals = allGoals.map((g) => {
      let currentVal = Number(g.currentValue) || 0;
      let targetVal = Number(g.targetValue) || 1;
      let pct = targetVal > 0 ? Number(((currentVal / targetVal) * 100).toFixed(1)) : 0;
      let effectiveStatus = g.status;

      if (pct >= 100) {
        effectiveStatus = 'completed';
      } else if (g.deadline && new Date(g.deadline) < now) {
        effectiveStatus = 'overdue';
      } else if (pct < 40 && g.deadline && (new Date(g.deadline) - now) < (1000 * 3600 * 24 * 30)) {
        // Less than 30 days remaining and less than 40% achieved
        if (effectiveStatus !== 'not_started') effectiveStatus = 'at_risk';
      }

      totalPercentageSum += Math.min(100, pct);

      if (effectiveStatus === 'completed') completedCount += 1;
      else if (effectiveStatus === 'in_progress') inProgressCount += 1;
      else if (effectiveStatus === 'at_risk' || effectiveStatus === 'overdue') atRiskOrOverdueCount += 1;

      // Category breakdown
      const cat = g.category || 'Academic Excellence';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, target: 0, actual: 0, count: 0 };
      categoryMap[cat].target += targetVal;
      categoryMap[cat].actual += currentVal;
      categoryMap[cat].count += 1;

      // Department breakdown
      const deptKey = g.department?.name || 'Institution-Wide';
      if (!departmentMap[deptKey]) departmentMap[deptKey] = { department: deptKey, total: 0, completed: 0, achievementSum: 0 };
      departmentMap[deptKey].total += 1;
      departmentMap[deptKey].achievementSum += Math.min(100, pct);
      if (effectiveStatus === 'completed') departmentMap[deptKey].completed += 1;

      const remainingGap = Math.max(0, targetVal - currentVal);

      return {
        ...g,
        id: g._id,
        achievementPercentage: pct,
        remainingGap,
        status: effectiveStatus
      };
    });

    const totalGoals = updatedGoals.length;
    const overallTargetAchievement =
      totalGoals > 0 ? Number((totalPercentageSum / totalGoals).toFixed(1)) : 0;

    const departmentComparison = Object.values(departmentMap).map((d) => ({
      department: d.department,
      totalGoals: d.total,
      completedGoals: d.completed,
      averageAchievement: d.total > 0 ? Math.round(d.achievementSum / d.total) : 0
    }));

    const categoryBreakdown = Object.values(categoryMap).map((c) => ({
      category: c.category,
      goalCount: c.count,
      targetAverage: Math.round(c.target / (c.count || 1)),
      actualAverage: Math.round(c.actual / (c.count || 1))
    }));

    const statusDistribution = {
      not_started: updatedGoals.filter((g) => g.status === 'not_started').length,
      in_progress: inProgressCount,
      at_risk: updatedGoals.filter((g) => g.status === 'at_risk').length,
      completed: completedCount,
      overdue: updatedGoals.filter((g) => g.status === 'overdue').length
    };

    const summary = {
      totalGoals,
      completedGoals: completedCount,
      inProgressGoals: inProgressCount,
      atRiskOrOverdueGoals: atRiskOrOverdueCount,
      overallTargetAchievement,
      departmentComparison,
      categoryBreakdown,
      statusDistribution
    };

    const paginatedItems = updatedGoals.slice(skip, skip + limit);

    return sendSuccess(res, {
      message: 'Institutional goals retrieved successfully',
      data: {
        summary,
        goals: paginatedItems,
        pagination: {
          page,
          limit,
          total: totalGoals,
          totalPages: Math.ceil(totalGoals / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Summary Metrics for Dashboard KPI Progress
 */
async function getGoalsSummary(req, res, next) {
  try {
    const allGoals = await Goal.find().lean();
    const now = new Date();

    let completedCount = 0;
    let inProgressCount = 0;
    let atRiskOrOverdueCount = 0;
    let totalPercentageSum = 0;

    allGoals.forEach((g) => {
      let currentVal = Number(g.currentValue) || 0;
      let targetVal = Number(g.targetValue) || 1;
      let pct = targetVal > 0 ? Number(((currentVal / targetVal) * 100).toFixed(1)) : 0;
      let effectiveStatus = g.status;

      if (pct >= 100) {
        effectiveStatus = 'completed';
      } else if (g.deadline && new Date(g.deadline) < now) {
        effectiveStatus = 'overdue';
      } else if (pct < 40 && g.deadline && (new Date(g.deadline) - now) < (1000 * 3600 * 24 * 30)) {
        if (effectiveStatus !== 'not_started') effectiveStatus = 'at_risk';
      }

      totalPercentageSum += Math.min(100, pct);
      if (effectiveStatus === 'completed') completedCount += 1;
      else if (effectiveStatus === 'in_progress') inProgressCount += 1;
      else if (effectiveStatus === 'at_risk' || effectiveStatus === 'overdue') atRiskOrOverdueCount += 1;
    });

    const totalGoals = allGoals.length;
    const overallTargetAchievement =
      totalGoals > 0 ? Number((totalPercentageSum / totalGoals).toFixed(1)) : 0;

    return sendSuccess(res, {
      message: 'Institutional goals summary retrieved',
      data: {
        totalGoals,
        completedGoals: completedCount,
        inProgressGoals: inProgressCount,
        atRiskOrOverdueGoals: atRiskOrOverdueCount,
        overallTargetAchievement
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Goal Details by ID
 */
async function getGoalById(req, res, next) {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('department', 'name code')
      .populate('owner', 'name email role')
      .populate('progressHistory.recordedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!goal) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional goal not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: goal });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Goal
 */
async function createGoal(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      targetValue,
      currentValue,
      unit,
      priority,
      owner,
      department,
      periodType,
      academicYear,
      semester,
      startDate,
      deadline
    } = req.body;

    const currVal = currentValue !== undefined ? Number(currentValue) : 0;
    const tgtVal = Number(targetValue);
    const achievementPct = tgtVal > 0 ? Number(((currVal / tgtVal) * 100).toFixed(1)) : 0;
    const initialStatus = achievementPct >= 100 ? 'completed' : currVal > 0 ? 'in_progress' : 'not_started';

    const goal = await Goal.create({
      title,
      description,
      category: category || 'Academic Excellence',
      targetValue: tgtVal,
      currentValue: currVal,
      unit: unit || '%',
      priority: priority || 'medium',
      owner,
      department: department || null,
      periodType: periodType || 'annual',
      academicYear: academicYear || '2026-2027',
      semester: semester ? Number(semester) : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: new Date(deadline),
      status: initialStatus,
      achievementPercentage: achievementPct,
      progressHistory: currVal > 0 ? [{
        value: currVal,
        percentage: achievementPct,
        note: 'Initial baseline measurement',
        recordedAt: new Date(),
        recordedBy: req.user._id
      }] : [],
      createdBy: req.user._id
    });

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_GOAL_CREATED',
      entityType: 'Goal',
      entityId: goal._id,
      details: { title: goal.title, targetValue: goal.targetValue, unit: goal.unit }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Institutional goal registered successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Goal
 */
async function updateGoal(req, res, next) {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional goal not found',
        code: 'NOT_FOUND'
      });
    }

    const {
      title,
      description,
      category,
      targetValue,
      unit,
      priority,
      owner,
      department,
      periodType,
      academicYear,
      semester,
      startDate,
      deadline,
      status
    } = req.body;

    if (title) goal.title = title;
    if (description) goal.description = description;
    if (category) goal.category = category;
    if (targetValue !== undefined) goal.targetValue = Number(targetValue);
    if (unit) goal.unit = unit;
    if (priority) goal.priority = priority;
    if (owner) goal.owner = owner;
    if (department !== undefined) goal.department = department || null;
    if (periodType) goal.periodType = periodType;
    if (academicYear) goal.academicYear = academicYear;
    if (semester !== undefined) goal.semester = semester ? Number(semester) : undefined;
    if (startDate) goal.startDate = new Date(startDate);
    if (deadline) goal.deadline = new Date(deadline);
    if (status) goal.status = status;

    if (goal.targetValue > 0) {
      goal.achievementPercentage = Number(((goal.currentValue / goal.targetValue) * 100).toFixed(1));
    }

    await goal.save();

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_GOAL_UPDATED',
      entityType: 'Goal',
      entityId: goal._id,
      details: { title: goal.title, status: goal.status }
    });

    return sendSuccess(res, {
      message: 'Institutional goal updated successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Goal
 */
async function deleteGoal(req, res, next) {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional goal not found',
        code: 'NOT_FOUND'
      });
    }

    await Goal.findByIdAndDelete(req.params.id);

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_GOAL_DELETED',
      entityType: 'Goal',
      entityId: goal._id,
      details: { title: goal.title }
    });

    return sendSuccess(res, {
      message: 'Institutional goal removed successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record Progress Update
 */
async function recordGoalProgress(req, res, next) {
  try {
    const { value, note } = req.body;

    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional goal not found',
        code: 'NOT_FOUND'
      });
    }

    const newVal = Number(value);
    const tgtVal = Number(goal.targetValue) || 1;
    const pct = Number(((newVal / tgtVal) * 100).toFixed(1));

    goal.currentValue = newVal;
    goal.achievementPercentage = pct;

    if (pct >= 100) {
      goal.status = 'completed';
    } else if (goal.deadline && new Date(goal.deadline) < new Date()) {
      goal.status = 'overdue';
    } else {
      goal.status = 'in_progress';
    }

    goal.progressHistory.push({
      value: newVal,
      percentage: pct,
      note: note || `Updated progress to ${newVal} ${goal.unit}`,
      recordedAt: new Date(),
      recordedBy: req.user._id
    });

    await goal.save();

    await recordAuditLog({
      req,
      action: 'GOAL_PROGRESS_RECORDED',
      entityType: 'Goal',
      entityId: goal._id,
      details: {
        title: goal.title,
        currentValue: newVal,
        percentage: pct
      }
    });

    return sendSuccess(res, {
      message: 'Goal progress logged successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listGoals,
  getGoalsSummary,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  recordGoalProgress
};


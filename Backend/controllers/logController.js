const Log = require('../models/Log');
const User = require('../models/User');
const moment = require('moment');

// 1. Handle Start, Pause, Auto-Pause, End
exports.logTimeEvent = async (req, res) => {
  const userId = req.session.userId;
  const { status, break: breakTime } = req.body;
  const today = moment().startOf('day').toDate();

  let log = await Log.findOne({ userId, logDate: today });
  const safeBreak = Number(breakTime) || 5;

  if (status === 'start') {
    if (!log || log.status === 'ended') {
      log = new Log({
        userId,
        startTime: new Date(),
        logDate: today,
        status: 'running',
        breakTime: 0,
        breakCount: 0,
        approveness: 'Approved'
      });
    } else if (log.status === 'auto-paused' && log.approveness !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Approval required' });
    } else {
      log.status = 'running';
    }

  // the set to the mian module is been set to the main frame of the world
    log.approveness = 'Approved'; // reset to approved if allowed
    await log.save();
    return res.json({ success: true });
  }

  if (['pause', 'end', 'auto-pause'].includes(status) && log) {
    if (status === 'pause') {
      log.status = 'paused';
      log.breakTime += safeBreak;
      log.breakCount += 1;
    } else if (status === 'end') {
      log.status = 'ended';
      log.endTime = new Date();
    } else if (status === 'auto-pause') {
      log.status = 'auto-paused';
      log.breakTime += safeBreak;
      log.breakCount += 1;
      log.approveness = 'Pending';

      const user = await User.findById(userId);
      if (global._io && user) {
        global._io.emit('approval_request', {
          userId: user._id,
          name: user.name,
          loginId: user.loginId,
          time: new Date().toLocaleTimeString()
        });
      }
    }

    await log.save();
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: 'Invalid operation' });
};

// 2. Return Session Status for Employee
exports.getSessionStatus = async (req, res) => {
  const today = moment().startOf('day').toDate();
  const log = await Log.findOne({ userId: req.session.userId, logDate: today });

  if (!log) {
    return res.json({ success: true, data: { status: 'none' } });
  }

  const secondsWorked = log.endTime
    ? Math.floor((log.endTime - log.startTime) / 1000)
    : Math.floor((Date.now() - log.startTime) / 1000);

  res.json({
    success: true,
    data: {
      status: log.status,
      start_time: log.startTime,
      worked_seconds: secondsWorked,
      break_time: log.breakTime,
      break_count: log.breakCount,
      approveness: log.approveness
    }
  });
};

// 3. Check Approval Status
exports.checkApproval = async (req, res) => {
  const today = moment().startOf('day').toDate();
  const log = await Log.findOne({ userId: req.session.userId, logDate: today });
  const approved = log && log.approveness === 'Approved';
  res.json({ success: true, data: { approved } });
};

// 4. Ask for Admin Approval
exports.askForApproval = async (req, res) => {
  const user = await User.findById(req.session.userId);
  const today = moment().startOf('day').toDate();

  await Log.updateOne(
    { userId: user._id, logDate: today },
    { approveness: 'Pending' }
  );
// The main module is been set to the main frame
  if (global._io) {
    global._io.emit('approval_request', {
      userId: user._id,
      name: user.name,
      loginId: user.loginId,
      time: new Date().toLocaleTimeString()
    });
  }

  res.json({ success: true });
};
// The main module is been set to the main set to the main frame
// 5. Admin Accept or Reject Approval
exports.adminApproveResume = async (req, res, actionFromRoute) => {
  const { id } = req.params;
  const action = actionFromRoute || req.body.action;
  const today = moment().startOf('day').toDate();

  const log = await Log.findOne({ userId: id, logDate: today });
  if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

  if (action === 'approve') {
    log.approveness = 'Approved';
    log.status = 'running';
  } else if (action === 'reject') {
    log.approveness = 'Denied';
    log.status = 'ended';
    log.endTime = new Date();
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }

  await log.save();
  res.json({ success: true });
};

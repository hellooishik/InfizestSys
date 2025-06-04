const Log = require('../models/Log');
const User = require('../models/User');
const moment = require('moment');

// 1. START, PAUSE, AUTO-PAUSE, END
exports.logTimeEvent = async (req, res) => {
  const userId = req.session.userId;
  const { status, break: breakTime } = req.body;
  const today = moment().startOf('day').toDate();

  let log = await Log.findOne({ userId, logDate: today });

  if (status === 'start') {
    if (!log || log.status === 'ended') {
      log = new Log({
        userId,
        startTime: new Date(),
        logDate: today,
        status: 'running',
        breakTime: 0,
        breakCount: 0,
        approveness: 'Pending'  // Valid enum value
      });
    } else {
      log.status = 'running';
    }
    await log.save();
    return res.json({ success: true });
  }

  if (['pause', 'end', 'auto-pause'].includes(status) && log) {
    const safeBreak = Number(breakTime) || 5;

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
    }

    await log.save();
    return res.json({ success: true });
  }

  res.status(400).json({ message: 'Invalid operation' });
};

// 2. SESSION STATUS
exports.getSessionStatus = async (req, res) => {
  const today = moment().startOf('day').toDate();
  const log = await Log.findOne({ userId: req.session.userId, logDate: today });

  if (!log) return res.json({ success: true, data: { status: 'none' } });

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

// 3. CHECK IF APPROVED
exports.checkApproval = async (req, res) => {
  const today = moment().startOf('day').toDate();
  const log = await Log.findOne({ userId: req.session.userId, logDate: today });
  const approved = log && log.approveness === 'Approved';
  res.json({ success: true, data: { approved } });
};

// 4. EMPLOYEE CLICKS "ASK FOR APPROVAL"
exports.askForApproval = async (req, res) => {
  const user = await User.findById(req.session.userId);
  const today = moment().startOf('day').toDate();

  await Log.updateOne(
    { userId: user._id, logDate: today },
    { approveness: 'Pending' }
  );

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

// 5. REDUNDANT REQUEST ENDPOINT
exports.requestApproval = async (req, res) => {
  const today = moment().startOf('day').toDate();
  await Log.updateOne(
    { userId: req.session.userId, logDate: today },
    { approveness: 'Pending' }
  );
  res.json({ success: true });
};

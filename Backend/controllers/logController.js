const Log = require('../models/Log');
const moment = require('moment');

exports.logTimeEvent = async (req, res) => {
  const userId = req.session.userId;
  const { status, break: breakTime } = req.body;
  const today = moment().startOf('day').toDate();

  let log = await Log.findOne({ userId, logDate: today });

  if (status === 'start') {
    if (!log || log.status === 'ended') {
      log = new Log({ userId, startTime: new Date(), logDate: today });
      await log.save();
    } else {
      log.status = 'running';
      await log.save();
    }
    return res.json({ success: true });
  }

  if (['pause', 'end', 'auto-pause'].includes(status) && log) {
    if (status === 'pause') {
      log.status = 'paused';
      log.breakTime += breakTime;
      log.breakCount += 1;
    } else if (status === 'end') {
      log.status = 'ended';
      log.endTime = new Date();
    } else if (status === 'auto-pause') {
      log.status = 'auto-paused';
      log.breakTime += breakTime;
      log.breakCount += 1;
      log.approveness = 'Pending';
    }
    await log.save();
    return res.json({ success: true });
  }

  res.status(400).json({ message: 'Invalid operation' });
};

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

exports.checkApproval = async (req, res) => {
  const today = moment().startOf('day').toDate();
  const log = await Log.findOne({ userId: req.session.userId, logDate: today });
  const approved = log && log.approveness === 'Approved';
  res.json({ success: true, data: { approved } });
};

exports.requestApproval = async (req, res) => {
  const today = moment().startOf('day').toDate();
  await Log.updateOne(
    { userId: req.session.userId, logDate: today },
    { approveness: 'Pending' }
  );
  res.json({ success: true });
};

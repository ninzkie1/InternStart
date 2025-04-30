const InternLog = require('../models/InternLog');

// @desc    Time In for intern
// @route   POST /api/intern-logs/time-in
// @access  Private
const timeIn = async (req, res) => {
  try {
    // Check if there's an ongoing session
    const ongoingLog = await InternLog.findOne({
      user: req.user._id,
      status: 'ongoing'
    });

    if (ongoingLog) {
      return res.status(400).json({
        success: false,
        message: 'You already have an ongoing session'
      });
    }

    // Create new log
    const log = await InternLog.create({
      user: req.user._id,
      timeIn: new Date(),
      date: new Date().setHours(0, 0, 0, 0),
      description: req.body.description || ''
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Time Out for intern
// @route   POST /api/intern-logs/time-out
// @access  Private
const timeOut = async (req, res) => {
  try {
    // Find ongoing session
    const log = await InternLog.findOne({
      user: req.user._id,
      status: 'ongoing'
    });

    if (!log) {
      return res.status(400).json({
        success: false,
        message: 'No ongoing session found'
      });
    }

    const timeOut = new Date();
    const timeIn = new Date(log.timeIn);
    
    // Calculate total hours (difference in milliseconds converted to hours)
    const totalHours = (timeOut - timeIn) / (1000 * 60 * 60);

    // Update log
    log.timeOut = timeOut;
    log.totalHours = totalHours;
    log.status = 'completed';
    if (req.body.description) {
      log.description = req.body.description;
    }
    await log.save();

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update log description
// @route   PATCH /api/intern-logs/:id/description
// @access  Private
const updateDescription = async (req, res) => {
  try {
    const log = await InternLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    log.description = req.body.description;
    await log.save();

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get today's log for intern
// @route   GET /api/intern-logs/today
// @access  Private
const getTodayLog = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await InternLog.findOne({
      user: req.user._id,
      date: today
    });

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all logs for intern
// @route   GET /api/intern-logs
// @access  Private
const getLogs = async (req, res) => {
  try {
    const logs = await InternLog.find({
      user: req.user._id
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  timeIn,
  timeOut,
  getTodayLog,
  getLogs,
  updateDescription
}; 
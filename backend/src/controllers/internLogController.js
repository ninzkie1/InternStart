const InternLog = require('../models/InternLog');

// @desc    Time In for intern
// @route   POST /api/intern-logs/time-in
// @access  Private
const timeIn = async (req, res) => {
  try {
    console.log('Time in request:', {
      userId: req.user._id,
      organizationId: req.body.organizationId || 'none'
    });
    
    // Create a query filter for ongoing session check
    let filter = {
      user: req.user._id,
      status: 'ongoing'
    };
    
    // Only filter by organization if one is provided
    if (req.body.organizationId) {
      filter.organization = req.body.organizationId;
    } else {
      // If no organization provided, check for any ongoing session without organization
      filter.organization = null;
    }
    
    console.log('Finding ongoing sessions with filter:', filter);
    
    // Check if there's an ongoing session
    const ongoingLog = await InternLog.findOne(filter);

    if (ongoingLog) {
      return res.status(400).json({
        success: false,
        message: req.body.organizationId 
          ? 'You already have an ongoing session in this organization'
          : 'You already have an ongoing session without an organization'
      });
    }

    // Create log data
    const logData = {
      user: req.user._id,
      timeIn: new Date(),
      date: new Date().setHours(0, 0, 0, 0),
      description: req.body.description || ''
    };
    
    // Only add organization field if one is provided
    if (req.body.organizationId) {
      logData.organization = req.body.organizationId;
    } else {
      // Explicitly set to null when no organization is selected
      logData.organization = null;
    }
    
    console.log('Creating log with data:', logData);
    
    // Create new log
    const log = await InternLog.create(logData);
    console.log('Log created:', log._id);

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error in timeIn:', error);
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
    console.log('Time out request:', {
      userId: req.user._id,
      organizationId: req.body.organizationId || 'none'
    });
    
    // Create a query filter for ongoing session
    let filter = {
      user: req.user._id,
      status: 'ongoing'
    };
    
    // Only filter by organization if one is provided
    if (req.body.organizationId) {
      filter.organization = req.body.organizationId;
    } else {
      // If no organization provided, look for logs with null organization
      filter.organization = null;
    }
    
    console.log('Finding ongoing session with filter:', filter);
    
    // Find ongoing session
    const log = await InternLog.findOne(filter);
    
    console.log('Log found:', log ? 'Yes' : 'No');

    if (!log) {
      return res.status(400).json({
        success: false,
        message: req.body.organizationId 
          ? 'No ongoing session found in this organization' 
          : 'No ongoing session found without an organization'
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
    console.error('Error in timeOut:', error);
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
    console.log('Get today log request:', {
      userId: req.user._id,
      organizationId: req.query.organizationId || 'none'
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create query object
    let query = {
      user: req.user._id,
      date: today
    };

    // Only add organization to query if it's a valid value
    if (req.query.organizationId && req.query.organizationId !== 'undefined' && req.query.organizationId !== 'null') {
      query.organization = req.query.organizationId;
    } else {
      // If no organization is specified, look for logs with null organization
      query.organization = null;
    }
    
    console.log('Finding today log with query:', query);

    const log = await InternLog.findOne(query);
    console.log('Today log found:', log ? 'Yes' : 'No');

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error in getTodayLog:', error);
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
    console.log('Get logs request:', {
      userId: req.user._id,
      organizationId: req.query.organizationId || 'none'
    });
    
    // Create query object
    let query = {
      user: req.user._id
    };

    // Only add organization to query if it's a valid value
    if (req.query.organizationId && req.query.organizationId !== 'undefined' && req.query.organizationId !== 'null') {
      query.organization = req.query.organizationId;
    } else {
      // If no organization is specified, look for logs with null organization
      query.organization = null;
    }
    
    console.log('Finding logs with query:', query);

    const logs = await InternLog.find(query).sort({ date: -1 });
    console.log('Found logs count:', logs.length);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error in getLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a log
// @route   DELETE /api/intern-logs/:id
// @access  Private
const deleteLog = async (req, res) => {
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

    await log.deleteOne();

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting log:', error);
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
  updateDescription,
  deleteLog
};

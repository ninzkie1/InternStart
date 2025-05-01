const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Organization = require('../models/organizationModel');
const User = require('../models/userModel');
const Invite = require('../models/inviteModel');
const JoinRequest = require('../models/joinRequestModel');
const InternLog = require('../models/InternLog');

// Middleware to check if user is a leader
const isLeader = (req, res, next) => {
  if (req.user.role !== 'leader' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only leaders can perform this action' });
  }
  next();
};

// Get leader's organization
router.get('/my-org', protect, async (req, res) => {
  try {
    const organization = await Organization.findOne({ leader: req.user._id })
      .populate('leader', 'username email')
      .populate('members', 'username email');
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if invite code is expired or doesn't exist
    const now = new Date();
    if (!organization.inviteCode || !organization.inviteCodeExpires || organization.inviteCodeExpires <= now) {
      organization.generateInviteCode();
      await organization.save();
    }
    
    // Generate the full invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${organization.inviteCode}`;
    
    res.json({
      ...organization.toJSON(),
      inviteLink,
      inviteCode: organization.inviteCode,
      inviteCodeExpires: organization.inviteCodeExpires
    });
  } catch (error) {
    console.error('Error in /my-org:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get pending join requests for leader's organization
router.get('/join-requests', protect, isLeader, async (req, res) => {
  try {
    console.log('Fetching join requests for user:', req.user._id);
    
    const organization = await Organization.findOne({ leader: req.user._id });
    if (!organization) {
      console.log('No organization found for leader:', req.user._id);
      return res.status(404).json({ message: 'Organization not found' });
    }

    console.log('Found organization:', organization._id);
    const joinRequests = await JoinRequest.find({
      organization: organization._id,
      status: 'pending'
    }).populate('user', 'username email');

    console.log('Found join requests:', joinRequests.length);
    res.json(joinRequests);
  } catch (error) {
    console.error('Error in /join-requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch join requests',
      error: error.message 
    });
  }
});

// Approve join request
router.post('/join-requests/:requestId/approve', protect, isLeader, async (req, res) => {
  try {
    const joinRequest = await JoinRequest.findById(req.params.requestId)
      .populate('organization')
      .populate('user');

    if (!joinRequest || joinRequest.status !== 'pending') {
      return res.status(404).json({ message: 'Join request not found or already processed' });
    }

    // Verify the leader owns the organization
    if (joinRequest.organization.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    // Update join request status
    joinRequest.status = 'approved';
    await joinRequest.save();

    // Add user to organization
    const organization = joinRequest.organization;
    if (!organization.members.includes(joinRequest.user._id)) {
      organization.members.push(joinRequest.user._id);
      await organization.save();
    }

    // Update user's organization reference and role
    await User.findByIdAndUpdate(joinRequest.user._id, {
      organization: organization._id,
      role: 'intern'
    });

    res.json({ message: 'Join request approved successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Decline join request
router.post('/join-requests/:requestId/decline', protect, isLeader, async (req, res) => {
  try {
    const joinRequest = await JoinRequest.findById(req.params.requestId)
      .populate('organization');

    if (!joinRequest || joinRequest.status !== 'pending') {
      return res.status(404).json({ message: 'Join request not found or already processed' });
    }

    // Verify the leader owns the organization
    if (joinRequest.organization.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    // Update join request status
    joinRequest.status = 'declined';
    await joinRequest.save();

    res.json({ message: 'Join request declined successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create organization (leader only)
router.post('/', protect, isLeader, async (req, res) => {
  try {
    const { name, description } = req.body;
    const organization = await Organization.create({
      name,
      description,
      leader: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all organizations
router.get('/', protect, async (req, res) => {
  try {
    const organizations = await Organization.find()
      .populate('leader', 'username email')
      .populate('members', 'username email');
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get organizations where user is a member
router.get('/my-organizations', protect, async (req, res) => {
  try {
    const organizations = await Organization.find({
      members: req.user._id
    }).populate('leader', 'username email');

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get organization by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('leader', 'username email')
      .populate('members', 'username email');
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update organization (leader only)
router.put('/:id', protect, isLeader, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    if (organization.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organization leader can update it' });
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedOrg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add member to organization (leader only)
router.post('/:id/members', protect, isLeader, async (req, res) => {
  try {
    const { userId } = req.body;
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    if (organization.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organization leader can add members' });
    }

    if (organization.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    organization.members.push(userId);
    await organization.save();
    res.json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Invite intern to organization (generates invite link)
router.post('/:id/invite', protect, isLeader, async (req, res) => {
  try {
    const { email } = req.body;
    const organization = await Organization.findOne({
      _id: req.params.id,
      leader: req.user._id
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Create invite with token
    const invite = await Invite.create({
      organization: organization._id,
      email
    });

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL}/join-organization/${invite.token}`;

    res.status(201).json({
      message: 'Invitation sent successfully',
      inviteLink,
      invite
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all pending invites for leader's organization
router.get('/invites/leader', protect, isLeader, async (req, res) => {
  try {
    const organization = await Organization.findOne({ leader: req.user._id });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const invites = await Invite.find({
      organization: organization._id,
      status: 'pending'
    });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify invite token and get organization details
router.get('/invite/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({
      token: req.params.token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('organization', 'name description');

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    res.json({
      invite,
      organization: invite.organization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/reject invite by leader
router.post('/invite/:token/respond', protect, isLeader, async (req, res) => {
  try {
    const { accept } = req.body;
    const invite = await Invite.findOne({
      token: req.params.token,
      status: 'pending'
    });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite' });
    }

    const organization = await Organization.findOne({
      _id: invite.organization,
      leader: req.user._id
    });

    if (!organization) {
      return res.status(403).json({ message: 'Not authorized to respond to this invite' });
    }

    invite.status = accept ? 'accepted' : 'rejected';
    await invite.save();

    res.json({ message: `Invite ${accept ? 'accepted' : 'rejected'} successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Join organization with invite token
router.post('/join/:token', protect, async (req, res) => {
  try {
    const invite = await Invite.findOne({
      token: req.params.token,
      status: 'accepted',
      expiresAt: { $gt: new Date() }
    });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'This invite is not for your email address' });
    }

    const organization = await Organization.findById(invite.organization);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Add user to organization
    if (!organization.members.includes(req.user._id)) {
      organization.members.push(req.user._id);
      await organization.save();
    }

    // Update user's organization
    await User.findByIdAndUpdate(req.user._id, {
      organization: organization._id
    });

    res.json({ message: 'Successfully joined organization', organization });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get organization by invite code
router.get('/org/:inviteCode', async (req, res) => {
  try {
    console.log('Looking for organization with invite code:', req.params.inviteCode);
    
    const organization = await Organization.findOne({ 
      inviteCode: req.params.inviteCode,
      inviteCodeExpires: { $gt: new Date() }
    }).populate('leader', 'username email');

    console.log('Found organization:', organization);

    if (!organization) {
      return res.status(404).json({ 
        message: 'Organization not found or invite code has expired',
        inviteCode: req.params.inviteCode 
      });
    }

    res.json(organization);
  } catch (error) {
    console.error('Error finding organization:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate new invite code (leader only)
router.post('/generate-invite', protect, isLeader, async (req, res) => {
  try {
    const organization = await Organization.findOne({ leader: req.user._id });
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    organization.generateInviteCode();
    await organization.save();

    res.json({ 
      message: 'New invite code generated',
      inviteCode: organization.inviteCode,
      expiresAt: organization.inviteCodeExpires
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join organization by invite code
router.post('/org/:inviteCode/join', protect, async (req, res) => {
  try {
    console.log('Attempting to join with invite code:', req.params.inviteCode);
    
    const organization = await Organization.findOne({ 
      inviteCode: req.params.inviteCode,
      inviteCodeExpires: { $gt: new Date() }
    }).populate('leader', 'username email');
    
    if (!organization) {
      return res.status(404).json({ 
        message: 'Organization not found or invite code has expired',
        inviteCode: req.params.inviteCode 
      });
    }

    // Check if user is already a member
    if (organization.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already a member of this organization' });
    }

    // Check if there's already a pending request
    const existingRequest = await JoinRequest.findOne({
      user: req.user._id,
      organization: organization._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending join request' });
    }

    // Create a join request instead of directly adding to organization
    const joinRequest = await JoinRequest.create({
      user: req.user._id,
      organization: organization._id
    });

    res.json({ 
      message: 'Join request submitted successfully. Waiting for leader approval.',
      joinRequest
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get organization details by invite code (public route)
router.get('/join/:inviteCode', async (req, res) => {
  try {
    console.log('Checking organization details with invite code:', req.params.inviteCode);
    
    const organization = await Organization.findOne({ 
      inviteCode: req.params.inviteCode,
      inviteCodeExpires: { $gt: new Date() }
    }).populate('leader', 'username email');
    
    if (!organization) {
      return res.status(404).json({ 
        message: 'Organization not found or invite code has expired',
        inviteCode: req.params.inviteCode 
      });
    }

    // Return public organization details
    const publicOrgData = {
      name: organization.name,
      description: organization.description,
      leader: {
        email: organization.leader.email
      },
      requiresAuth: true // Flag to indicate authentication is required
    };

    res.json(publicOrgData);
  } catch (error) {
    console.error('Error getting organization details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Join organization by invite code (protected route)
router.post('/join/:inviteCode', protect, async (req, res) => {
  try {
    console.log('Attempting to join with invite code:', req.params.inviteCode);
    
    // Check if user is the organization leader
    const organization = await Organization.findOne({ 
      inviteCode: req.params.inviteCode,
      inviteCodeExpires: { $gt: new Date() }
    }).populate('leader', 'username email');
    
    if (!organization) {
      return res.status(404).json({ 
        message: 'Organization not found or invite code has expired',
        inviteCode: req.params.inviteCode 
      });
    }

    // Prevent leader from joining their own organization
    if (organization.leader._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You are the leader of this organization',
        isLeader: true
      });
    }

    // Check if user is already a member
    if (organization.members.includes(req.user._id)) {
      return res.status(400).json({ 
        message: 'You are already a member of this organization',
        isMember: true
      });
    }

    // Add user to organization
    organization.members.push(req.user._id);
    await organization.save();

    // Update user's organization reference and role
    await User.findByIdAndUpdate(req.user._id, {
      organization: organization._id,
      role: 'intern' // Set role to intern when joining
    });

    // Return success without exposing invite code
    const orgData = organization.toJSON();
    delete orgData.inviteCode;
    delete orgData.inviteCodeExpires;

    res.json({ 
      message: 'Successfully joined organization', 
      organization: orgData
    });
  } catch (error) {
    console.error('Error joining organization:', error);
    res.status(400).json({ message: error.message });
  }
});

// Remove member from organization
router.delete('/:orgId/members/:memberId', protect, isLeader, async (req, res) => {
  try {
    const organization = await Organization.findOne({
      _id: req.params.orgId,
      leader: req.user._id
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Remove member from organization
    organization.members = organization.members.filter(
      memberId => memberId.toString() !== req.params.memberId
    );
    await organization.save();

    // Update user's organization reference
    await User.findByIdAndUpdate(req.params.memberId, {
      $unset: { organization: "" }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accept invite
router.post('/invites/:inviteId/accept', protect, isLeader, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: 'Invalid or expired invite' });
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invite accepted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Decline invite
router.post('/invites/:inviteId/decline', protect, isLeader, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: 'Invalid or expired invite' });
    }

    invite.status = 'declined';
    await invite.save();

    res.json({ message: 'Invite declined successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all intern logs for the leader's organization
router.get('/logs', protect, isLeader, async (req, res) => {
  try {
    const organization = await Organization.findOne({ leader: req.user._id });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    const logs = await InternLog.find({ organization: organization._id })
      .populate('user', 'username email')
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
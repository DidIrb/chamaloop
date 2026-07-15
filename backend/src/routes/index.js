const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerValidator, loginValidator, forgotPinValidator, resetPinValidator,
  addMemberValidator, resetMemberPinValidator, updateRotationValidator,
  startRoundValidator, markPaidValidator, updateSettingsValidator,
} = require('../middleware/validators');

const { register, login, forgotPin, resetPin } = require('../controllers/authController');
const { getAllMembers, addMember, updateRotationOrder, resetMemberPin, updateMemberBusiness } = require('../controllers/membersController');
const { getActiveRound, startRound, closeRound, markContributionPaid, markContributionLate } = require('../controllers/roundsController');
const { getHistory } = require('../controllers/historyController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { generateWordReport, generatePdfReport } = require('../controllers/reportsController');

// ── Auth routes (public)
router.post('/auth/register', registerValidator, validate, register);
router.post('/auth/login', loginValidator, validate, login);
router.post('/auth/forgot-pin', forgotPinValidator, validate, forgotPin);
router.post('/auth/reset-pin', resetPinValidator, validate, resetPin);

// ── Member routes
router.get('/members', authenticate, getAllMembers);
router.post('/members', authenticate, adminOnly, addMemberValidator, validate, addMember);
router.put('/members/:id/rotation', authenticate, adminOnly, updateRotationValidator, validate, updateRotationOrder);
router.put('/members/:id/reset-pin', authenticate, adminOnly, resetMemberPinValidator, validate, resetMemberPin);
router.put('/members/:id/business', authenticate, adminOnly, updateMemberBusiness);

// ── Round routes
router.get('/rounds/active', authenticate, getActiveRound);
router.post('/rounds', authenticate, adminOnly, startRoundValidator, validate, startRound);
router.put('/rounds/:id/close', authenticate, adminOnly, closeRound);
router.put('/rounds/:roundId/contributions/:memberId/pay', authenticate, adminOnly, markPaidValidator, validate, markContributionPaid);
router.put('/rounds/:roundId/contributions/:memberId/late', authenticate, adminOnly, markContributionLate);

// ── History (read only)
router.get('/history', authenticate, getHistory);

// ── Reports (admin only)
router.get('/reports/word', authenticate, adminOnly, generateWordReport);
router.get('/reports/pdf', authenticate, adminOnly, generatePdfReport);

// ── Settings
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, adminOnly, updateSettingsValidator, validate, updateSettings);

module.exports = router;

const { body, param } = require('express-validator');

const registerValidator = [
  body('chama_name').trim().notEmpty().withMessage('Chama name is required.'),
  body('contribution_amount')
    .notEmpty().withMessage('Contribution amount is required.')
    .isFloat({ min: 1 }).withMessage('Contribution amount must be a positive number.'),
  body('fine_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fine amount must be zero or a positive number.'),
  body('admin_name').trim().notEmpty().withMessage('Admin name is required.'),
  body('phone_number')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^0[0-9]{9}$/).withMessage('Phone number must be a valid Kenyan number e.g. 0712345678.'),
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address.'),
  body('pin')
    .notEmpty().withMessage('PIN is required.')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits.')
    .isNumeric().withMessage('PIN must contain digits only.'),
];

const loginValidator = [
  body('phone_number').trim().notEmpty().withMessage('Phone number is required.'),
  body('pin')
    .notEmpty().withMessage('PIN is required.')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits.')
    .isNumeric().withMessage('PIN must contain digits only.'),
];

const forgotPinValidator = [
  body('email').isEmail().withMessage('A valid email address is required.'),
];

const resetPinValidator = [
  body('email').isEmail().withMessage('A valid email address is required.'),
  body('code')
    .notEmpty().withMessage('Reset code is required.')
    .isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits.')
    .isNumeric().withMessage('Reset code must contain digits only.'),
  body('new_pin')
    .notEmpty().withMessage('New PIN is required.')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits.')
    .isNumeric().withMessage('PIN must contain digits only.'),
];

const addMemberValidator = [
  body('name').trim().notEmpty().withMessage('Member name is required.'),
  body('phone_number')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^0[0-9]{9}$/).withMessage('Phone number must be a valid Kenyan number e.g. 0712345678.'),
  body('pin')
    .notEmpty().withMessage('PIN is required.')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits.')
    .isNumeric().withMessage('PIN must contain digits only.'),
];

const resetMemberPinValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid member ID.'),
  body('new_pin')
    .notEmpty().withMessage('New PIN is required.')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits.')
    .isNumeric().withMessage('PIN must contain digits only.'),
];

const updateRotationValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid member ID.'),
  body('rotation_order')
    .notEmpty().withMessage('Rotation order is required.')
    .isInt({ min: 1 }).withMessage('Rotation order must be a positive whole number.'),
];

const startRoundValidator = [
  body('recipient_member_id')
    .notEmpty().withMessage('Recipient member is required.')
    .isInt({ min: 1 }).withMessage('Invalid recipient member ID.'),
];

const markPaidValidator = [
  param('roundId').isInt({ min: 1 }).withMessage('Invalid round ID.'),
  param('memberId').isInt({ min: 1 }).withMessage('Invalid member ID.'),
  body('mpesa_code')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('M-Pesa code must not exceed 20 characters.'),
];

const updateSettingsValidator = [
  body('chama_name').trim().notEmpty().withMessage('Chama name is required.'),
  body('contribution_amount')
    .notEmpty().withMessage('Contribution amount is required.')
    .isFloat({ min: 1 }).withMessage('Contribution amount must be a positive number.'),
  body('fine_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fine amount must be zero or a positive number.'),
  body('meeting_frequency')
    .optional()
    .isIn(['Weekly', 'Bi-weekly', 'Monthly']).withMessage('Meeting frequency must be Weekly, Bi-weekly, or Monthly.'),
];

module.exports = {
  registerValidator, loginValidator, forgotPinValidator, resetPinValidator,
  addMemberValidator, resetMemberPinValidator, updateRotationValidator,
  startRoundValidator, markPaidValidator, updateSettingsValidator,
};

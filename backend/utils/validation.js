const validator = require('validator');
const mongoose = require('mongoose');

/**
 * Validation Utilities
 * - Input validation helpers
 * - MongoDB ID validation
 * - Email validation
 * - Password strength validation
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} Validation result with isValid and message
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password cannot exceed 128 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: 'Password is valid' };
};

/**
 * Validate name
 * @param {string} name - The name to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
const validateName = (name, options = {}) => {
  const { min = 2, max = 50, required = true } = options;

  if (!name) {
    return required 
      ? { isValid: false, message: 'Name is required' }
      : { isValid: true, message: 'Name is optional' };
  }

  if (name.length < min) {
    return { isValid: false, message: `Name must be at least ${min} characters long` };
  }

  if (name.length > max) {
    return { isValid: false, message: `Name cannot exceed ${max} characters` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: 'Name is valid' };
};

/**
 * Validate phone number
 * @param {string} phone - The phone number to validate
 * @returns {object} Validation result
 */
const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: true, message: 'Phone number is optional' };
  }

  if (!validator.isMobilePhone(phone, 'any')) {
    return { isValid: false, message: 'Please provide a valid phone number' };
  }

  return { isValid: true, message: 'Phone number is valid' };
};

/**
 * Validate message content
 * @param {string} content - The message content to validate
 * @returns {object} Validation result
 */
const validateMessageContent = (content) => {
  if (!content) {
    return { isValid: false, message: 'Message content is required' };
  }

  if (content.trim().length === 0) {
    return { isValid: false, message: 'Message content cannot be empty' };
  }

  if (content.length > 4000) {
    return { isValid: false, message: 'Message content cannot exceed 4000 characters' };
  }

  return { isValid: true, message: 'Message content is valid' };
};

/**
 * Validate search query
 * @param {string} query - The search query to validate
 * @returns {object} Validation result
 */
const validateSearchQuery = (query) => {
  if (!query) {
    return { isValid: false, message: 'Search query is required' };
  }

  if (query.trim().length < 2) {
    return { isValid: false, message: 'Search query must be at least 2 characters long' };
  }

  if (query.length > 100) {
    return { isValid: false, message: 'Search query cannot exceed 100 characters' };
  }

  return { isValid: true, message: 'Search query is valid' };
};

/**
 * Validate pagination parameters
 * @param {object} params - Pagination parameters
 * @returns {object} Validation result with sanitized values
 */
const validatePagination = (params) => {
  const { page = 1, limit = 20 } = params;
  
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  if (isNaN(parsedPage) || parsedPage < 1) {
    return { 
      isValid: false, 
      message: 'Page must be a positive integer',
      page: 1,
      limit: 20
    };
  }

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return { 
      isValid: false, 
      message: 'Limit must be between 1 and 100',
      page: parsedPage,
      limit: 20
    };
  }

  return { 
    isValid: true, 
    message: 'Pagination parameters are valid',
    page: parsedPage,
    limit: parsedLimit
  };
};

/**
 * Validate file upload
 * @param {object} file - The file object from multer
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
const validateFile = (file, options = {}) => {
  const { 
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    required = false 
  } = options;

  if (!file) {
    return required 
      ? { isValid: false, message: 'File is required' }
      : { isValid: true, message: 'File is optional' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, message: `File size cannot exceed ${maxSize / (1024 * 1024)}MB` };
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, message: 'Invalid file type' };
  }

  return { isValid: true, message: 'File is valid' };
};

/**
 * Sanitize and validate user input
 * @param {any} input - The input to sanitize
 * @returns {any} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

/**
 * Validate chat name
 * @param {string} chatName - The chat name to validate
 * @returns {object} Validation result
 */
const validateChatName = (chatName) => {
  if (!chatName) {
    return { isValid: false, message: 'Chat name is required' };
  }

  if (chatName.trim().length === 0) {
    return { isValid: false, message: 'Chat name cannot be empty' };
  }

  if (chatName.length > 50) {
    return { isValid: false, message: 'Chat name cannot exceed 50 characters' };
  }

  return { isValid: true, message: 'Chat name is valid' };
};

/**
 * Validate bio/description
 * @param {string} bio - The bio to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} Validation result
 */
const validateBio = (bio, maxLength = 200) => {
  if (!bio) {
    return { isValid: true, message: 'Bio is optional' };
  }

  if (bio.length > maxLength) {
    return { isValid: false, message: `Bio cannot exceed ${maxLength} characters` };
  }

  return { isValid: true, message: 'Bio is valid' };
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateMessageContent,
  validateSearchQuery,
  validatePagination,
  validateFile,
  sanitizeInput,
  validateChatName,
  validateBio
};

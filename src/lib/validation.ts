/**
 * =============================================================================
 * CLEARSKIN AI - CLIENT-SIDE INPUT VALIDATION
 * =============================================================================
 * 
 * Comprehensive input validation utilities for React Native client.
 * Validates user inputs before sending to API endpoints.
 * 
 * Following OWASP client-side validation guidelines:
 * - Always validate on server side as well (defense in depth)
 * - Client validation improves UX and reduces unnecessary API calls
 * - Never trust client-side validation alone for security
 * 
 * @version 1.0.0
 * =============================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export interface FieldValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => ValidationResult;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Common regex patterns for validation
 */
export const PATTERNS = {
  // RFC 5322 compliant email (simplified)
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // UUID v4 format
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Stripe subscription ID format
  STRIPE_SUBSCRIPTION_ID: /^sub_[a-zA-Z0-9]+$/,
  
  // Alphanumeric with spaces (for names)
  NAME: /^[a-zA-Z\s'-]+$/,
  
  // No HTML tags
  NO_HTML: /^[^<>]*$/,
  
  // Safe text (no script injection patterns)
  SAFE_TEXT: /^(?!.*<script)(?!.*javascript:)(?!.*on\w+=).*$/i,
};

/**
 * Field length limits (matching server-side validation)
 */
export const LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  NAME_MAX: 100,
  SUBJECT_MAX: 100,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 1000,
  CONTEXT_MAX: 500,
  PATH_MAX: 500,
};

// =============================================================================
// SANITIZATION
// =============================================================================

/**
 * Sanitize string input - remove potentially dangerous characters
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)              // Limit length
    .replace(/[<>]/g, '')             // Remove HTML brackets
    .replace(/javascript:/gi, '')     // Remove javascript: protocol
    .replace(/data:/gi, '')           // Remove data: protocol
    .replace(/vbscript:/gi, '')       // Remove vbscript: protocol
    .replace(/on\w+=/gi, '')          // Remove event handlers
    .trim();
}

/**
 * Escape HTML entities for safe display
 * @param input - Raw string
 * @returns HTML-safe string
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate email address
 * @param email - Email to validate
 * @returns ValidationResult
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  if (trimmed.length > LIMITS.EMAIL_MAX) {
    return { valid: false, error: `Email must be ${LIMITS.EMAIL_MAX} characters or less` };
  }

  if (!PATTERNS.EMAIL.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate password
 * @param password - Password to validate
 * @returns ValidationResult
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < LIMITS.PASSWORD_MIN) {
    return { valid: false, error: `Password must be at least ${LIMITS.PASSWORD_MIN} characters` };
  }

  if (password.length > LIMITS.PASSWORD_MAX) {
    return { valid: false, error: `Password must be ${LIMITS.PASSWORD_MAX} characters or less` };
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty123', 'password123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Please choose a stronger password' };
  }

  return { valid: true };
}

/**
 * Validate password confirmation matches
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns ValidationResult
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
}

/**
 * Validate contact form subject
 * @param subject - Subject to validate
 * @returns ValidationResult
 */
export function validateSubject(subject: string): ValidationResult {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }

  const trimmed = subject.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Subject is required' };
  }

  if (trimmed.length > LIMITS.SUBJECT_MAX) {
    return { valid: false, error: `Subject must be ${LIMITS.SUBJECT_MAX} characters or less` };
  }

  // Sanitize
  const sanitized = sanitizeString(trimmed, LIMITS.SUBJECT_MAX);

  return { valid: true, sanitized };
}

/**
 * Validate contact form message
 * @param message - Message to validate
 * @returns ValidationResult
 */
export function validateMessage(message: string): ValidationResult {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message is required' };
  }

  if (trimmed.length < LIMITS.MESSAGE_MIN) {
    return { valid: false, error: `Message must be at least ${LIMITS.MESSAGE_MIN} characters` };
  }

  if (trimmed.length > LIMITS.MESSAGE_MAX) {
    return { valid: false, error: `Message must be ${LIMITS.MESSAGE_MAX} characters or less` };
  }

  // Sanitize
  const sanitized = sanitizeString(trimmed, LIMITS.MESSAGE_MAX);

  return { valid: true, sanitized };
}

/**
 * Validate scan context/notes
 * @param context - Context string to validate
 * @returns ValidationResult
 */
export function validateScanContext(context: string | undefined): ValidationResult {
  // Context is optional
  if (!context || typeof context !== 'string') {
    return { valid: true, sanitized: '' };
  }

  const trimmed = context.trim();

  if (trimmed.length === 0) {
    return { valid: true, sanitized: '' };
  }

  if (trimmed.length > LIMITS.CONTEXT_MAX) {
    return { valid: false, error: `Context must be ${LIMITS.CONTEXT_MAX} characters or less` };
  }

  // Check for suspicious content
  if (!PATTERNS.SAFE_TEXT.test(trimmed)) {
    return { valid: false, error: 'Context contains invalid characters' };
  }

  // Sanitize
  const sanitized = sanitizeString(trimmed, LIMITS.CONTEXT_MAX);

  return { valid: true, sanitized };
}

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @param fieldName - Name of the field for error messages
 * @returns ValidationResult
 */
export function validateUUID(uuid: string, fieldName: string = 'ID'): ValidationResult {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = uuid.trim();

  if (!PATTERNS.UUID.test(trimmed)) {
    return { valid: false, error: `Invalid ${fieldName} format` };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate storage path
 * @param path - Storage path to validate
 * @param userId - User ID for ownership check
 * @returns ValidationResult
 */
export function validateStoragePath(path: string, userId: string): ValidationResult {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path is required' };
  }

  const trimmed = path.trim();

  if (trimmed.length > LIMITS.PATH_MAX) {
    return { valid: false, error: 'Path is too long' };
  }

  // Check for path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('//')) {
    return { valid: false, error: 'Invalid path format' };
  }

  // Normalize path (remove leading slash)
  const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  // Verify path belongs to user
  const expectedPrefix = `user/${userId}/`;
  if (!normalized.startsWith(expectedPrefix)) {
    return { valid: false, error: 'Unauthorized path access' };
  }

  return { valid: true, sanitized: normalized };
}

/**
 * Validate name field (for display names, etc.)
 * @param name - Name to validate
 * @param fieldName - Field name for error messages
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateName(
  name: string,
  fieldName: string = 'Name',
  options: { required?: boolean; maxLength?: number } = {}
): ValidationResult {
  const { required = false, maxLength = LIMITS.NAME_MAX } = options;

  if (!name || typeof name !== 'string') {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: '' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: '' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be ${maxLength} characters or less` };
  }

  // Sanitize
  const sanitized = sanitizeString(trimmed, maxLength);

  return { valid: true, sanitized };
}

// =============================================================================
// COMPOSITE VALIDATORS
// =============================================================================

/**
 * Validate sign-in form
 */
export function validateSignInForm(email: string, password: string): {
  valid: boolean;
  errors: { email?: string; password?: string };
} {
  const errors: { email?: string; password?: string } = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate sign-up form
 */
export function validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string
): {
  valid: boolean;
  errors: { email?: string; password?: string; confirmPassword?: string };
} {
  const errors: { email?: string; password?: string; confirmPassword?: string } = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error;
  }

  const confirmResult = validatePasswordConfirm(password, confirmPassword);
  if (!confirmResult.valid) {
    errors.confirmPassword = confirmResult.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate contact form
 */
export function validateContactForm(subject: string, message: string): {
  valid: boolean;
  errors: { subject?: string; message?: string };
  sanitized: { subject: string; message: string };
} {
  const errors: { subject?: string; message?: string } = {};
  const sanitized = { subject: '', message: '' };

  const subjectResult = validateSubject(subject);
  if (!subjectResult.valid) {
    errors.subject = subjectResult.error;
  } else {
    sanitized.subject = subjectResult.sanitized || '';
  }

  const messageResult = validateMessage(message);
  if (!messageResult.valid) {
    errors.message = messageResult.error;
  } else {
    sanitized.message = messageResult.sanitized || '';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get character count message for UI
 * @param current - Current character count
 * @param max - Maximum allowed
 * @returns Formatted string
 */
export function getCharCountMessage(current: number, max: number): string {
  const remaining = max - current;
  if (remaining < 0) {
    return `${Math.abs(remaining)} characters over limit`;
  }
  return `${remaining} characters remaining`;
}

/**
 * Check if input is approaching length limit
 * @param current - Current character count
 * @param max - Maximum allowed
 * @param threshold - Warning threshold (default 90%)
 * @returns boolean
 */
export function isApproachingLimit(
  current: number,
  max: number,
  threshold: number = 0.9
): boolean {
  return current >= max * threshold;
}

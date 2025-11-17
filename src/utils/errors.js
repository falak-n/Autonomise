/**
 * Centralized Error Handling
 * 
 * Custom error types for better error handling
 */

export class UserNotFoundError extends Error {
  constructor(userName) {
    super(`User "${userName}" not found`);
    this.name = 'UserNotFoundError';
    this.type = 'USER_NOT_FOUND';
    this.userName = userName;
  }
}

export class NoActivityError extends Error {
  constructor(userName) {
    super(`No activity found for "${userName}"`);
    this.name = 'NoActivityError';
    this.type = 'NO_ACTIVITY';
    this.userName = userName;
  }
}

export class APIError extends Error {
  constructor(platform, message) {
    super(`${platform} API error: ${message}`);
    this.name = 'APIError';
    this.type = 'API_ERROR';
    this.platform = platform;
  }
}

/**
 * Handle errors gracefully
 */
export function handleError(error) {
  if (error instanceof UserNotFoundError) {
    return {
      type: 'USER_NOT_FOUND',
      message: error.message,
      userName: error.userName
    };
  }

  if (error instanceof NoActivityError) {
    return {
      type: 'NO_ACTIVITY',
      message: error.message,
      userName: error.userName
    };
  }

  if (error instanceof APIError) {
    return {
      type: 'API_ERROR',
      message: error.message,
      platform: error.platform
    };
  }

  // Generic error
  return {
    type: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred'
  };
}



export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, "API_ERROR", statusCode);
    this.name = "ApiError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "인증이 필요합니다") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class CreditError extends AppError {
  constructor(
    message: string = "크레딧이 부족합니다",
    public readonly required: number = 0,
    public readonly available: number = 0
  ) {
    super(message, "CREDIT_ERROR", 402);
    this.name = "CreditError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

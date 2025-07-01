import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
  validate,
  ValidationError,
} from "class-validator";
import { ValidationResult } from "../../../shared/validation";
import { ServiceResponse } from "../../../services/serviceResponse";
import { ResponseStatus } from "../../../services/serviceResponse";

export class RequestDto {
  async validate(): Promise<ValidationResult> {
    try {
      const validationErrors = await validate(this, {
        forbidUnknownValues: false,
      });

      if (validationErrors && validationErrors.length > 0) {
        return {
          ok: false,
          errors: validationErrors,
        };
      }

      return { ok: true, errors: [] };
    } catch (_: any) {
      return { ok: false, errors: [] };
    }
  }
}

export class ExchangeGoogleTokenBody extends RequestDto {
  @Length(1)
  code: string;

  constructor(body: any) {
    super();
    if (body && body.code) {
      this.code = String(body.code);
    }
  }
}

export class LogoutRequestBody extends RequestDto {
  constructor(body: any) {
    super();
    console.log("45: ", body);
    if (body && body.refresh_token) {
      this.refreshToken = String(body.refresh_token);
    }
  }

  @Length(1)
  refreshToken: string;
}

export class RefreshTokenRequestBody extends RequestDto {
  constructor(body: any) {
    super();
    if (body && body.refresh_token) {
      this.refreshToken = body.refresh_token;
    }
  }

  @Length(1)
  refreshToken: string;

  async validate(): Promise<ValidationResult> {
    const result = await super.validate();
    if (!result.ok) {
      return result;
    }

    // Adding another logic, token must have three parts, which are seprated by a dot.
    const parts = this.refreshToken.split(".");
    if (parts.length != 3) {
      const tokenInvalidError = new ValidationError();
      tokenInvalidError.constraints = {
        jsonwebtoken: "Invalid JSON Web Token format",
      };

      return {
        ok: false,
        errors: [tokenInvalidError],
      };
    }

    return {
      ok: true,
      errors: [],
    };
  }
}

export class RegisterRequestBody extends RequestDto {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  @IsNotEmpty({ message: "Password confirmation is required" })
  confirmPassword: string;

  @IsNotEmpty({ message: "Full name is required" })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  constructor(body: any) {
    super();
    if (body) {
      this.email = body.email;
      this.password = body.password;
      this.confirmPassword = body.confirmPassword; 
      this.name = body.name;
      this.avatar = body.avatar;
    }
  }

  public async validate(): Promise<ValidationResult> {
    // 1. Chạy các validation cơ bản từ decorator (@IsNotEmpty, @Length, @IsEmail,...)
    const initialResult = await super.validate();
    if (!initialResult.ok) {
      return initialResult;
    }

    // 2. Thêm logic validation tùy chỉnh: kiểm tra mật khẩu có khớp không
    if (this.password !== this.confirmPassword) {
      const passwordMismatchError = new ValidationError();
      // Gán lỗi này cho thuộc tính 'confirmPassword' để frontend biết cần hiển thị lỗi ở đâu
      passwordMismatchError.property = "confirmPassword";
      passwordMismatchError.constraints = {
        passwordMismatch: "Passwords do not match",
      };

      return {
        ok: false,
        errors: [passwordMismatchError],
      };
    }

    // Nếu tất cả đều hợp lệ
    return { ok: true, errors: [] };
  }
}

export class LoginRequestBody extends RequestDto {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  constructor(body: any) {
    super();
    if (body) {
      this.email = body.email;
      this.password = body.password;
    }
  }
}


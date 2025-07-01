import { Response, Request, NextFunction } from "express";
import env from "../../../utils/env";
import { AuthService } from "../types";
import {
  ExchangeGoogleTokenBody,
  LogoutRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  LoginRequestBody,
} from "./dto";
import { BaseController } from "../../../shared/base-controller";
import responseValidationError from "../../../shared/response";
import { HttpRequest } from "../../../types";
import { handleServiceResponse } from "../../../services/httpHandlerResponse";
import { StatusCodes } from "http-status-codes";

class AuthController extends BaseController {
  service: AuthService;

  constructor(service: AuthService) {
    super();
    this.service = service;
  }

  async exchangeGoogleToken(
    req: HttpRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execWithTryCatchBlock(
      req,
      res,
      next,
      async (req, res, _next) => {
        const exchangeGoogleTokenBody = new ExchangeGoogleTokenBody(req.query);

        const validateResult = await exchangeGoogleTokenBody.validate();
        if (!validateResult.ok) {
          responseValidationError(res, validateResult.errors[0]);
          return;
        }

        const exchangeResult = await this.service.exchangeWithGoogleIDP({
          idp: "google",
          code: exchangeGoogleTokenBody.code,
        });

        const params = new URLSearchParams({
          uid: exchangeResult.sub,
          access_token: exchangeResult.accessToken,
          refresh_token: exchangeResult.refreshToken,
        });

        const redirectURL = `${
          env.CLIENT_URL
        }/oauth/redirect?${params.toString()}`;
        res.redirect(redirectURL);

        return;
      }
    );
  }

  async logout(
    req: HttpRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execWithTryCatchBlock(
      req,
      res,
      next,
      async (req, res, _next) => {
        const logoutRequestBody = new LogoutRequestBody(req.body);
        const validateResult = await logoutRequestBody.validate();
        if (!validateResult.ok) {
          responseValidationError(res, validateResult.errors[0]);
          return;
        }

        const logout = await this.service.logout(
          logoutRequestBody.refreshToken
        );
        
        res.status(StatusCodes.OK).json({
          status: "Success",
          message: "User logged in successfully",
        });
      }
    );
  }

  async refreshToken(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    const refreshTokenRequestBody = new RefreshTokenRequestBody(req.body);
    const validateResult = await refreshTokenRequestBody.validate();
    if (!validateResult.ok) {
      responseValidationError(res, validateResult.errors[0]);
      return;
    }

    const token = await this.service.refreshToken(
      refreshTokenRequestBody.refreshToken
    );

    res.status(200).json({
      refresh_token: token.refreshToken,
      access_token: token.accessToken,
    });

    return;
  }

  async register(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, confirmPassword, name, avatar } = req.body;
      const registerRequestBody = new RegisterRequestBody(req.body);
      const validateResult = await registerRequestBody.validate();
      if (!validateResult.ok) {
        responseValidationError(res, validateResult.errors[0]);
        return;
      }

      const registerResult = await this.service.register(
        email,
        password,
        name,
        avatar
      );

      const serviceResponse = {
        success: true,
        message: "User registered successfully",
        data: registerResult,
        code: StatusCodes.OK,
      };

      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "Failed",
        message: "Error register",
        error: (error as Error).message,
      });
    }
  }

  async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const loginRequestBody = new LoginRequestBody(req.body);
      const validateResult = await loginRequestBody.validate();
      if (!validateResult.ok) {
        responseValidationError(res, validateResult.errors[0]);
        return;
      }

      const loginResult = await this.service.login(email, password);

      const serviceResponse = {
        success: true,
        message: "User logged in successfully",
        data: loginResult,
        code: StatusCodes.OK,
      };

      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "Failed",
        message: "Error logging in",
        error: (error as Error).message,
      });
    }
  }
}

export { AuthController };

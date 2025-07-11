import { v4 as uuidv4 } from "uuid";
import {
  AuthService,
  ExchangeTokenResult,
  ExchangeTokenRequest,
} from "../types";
import User from "../../../../../internal/model/user";
import Session from "../../../../../internal/model/session";
import jwt from "jsonwebtoken";
import { GoogleIdentityBroker } from "../identity-broker/google-idp.broker";
import bcrypt from "bcrypt";
import {
    ServiceResponse,
    ResponseStatus,
} from "../../../services/serviceResponse";
import { StatusCodes } from "http-status-codes";
export class AuthServiceImpl implements AuthService {
  googleIdentityBroker: GoogleIdentityBroker;
  jwtSecret: string;
  jwtRefreshSecret: string;

  constructor(
    googleIdentityBroker: GoogleIdentityBroker,
    jwtSecret: string,
    jwtRefreshSecret: string
  ) {
    this.googleIdentityBroker = googleIdentityBroker;
    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
  }

  signAccessToken(payload: any): string {
    return jwt.sign(
      {
        ...payload,
      },
      this.jwtSecret,
      { expiresIn: "1d" }
    );
  }

  signRefreshToken(payload: any): string {
    return jwt.sign({ ...payload, typ: "offline" }, this.jwtRefreshSecret, {
      expiresIn: "30d",
    });
  }

  verifyToken(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }

  async createUserIfNotExists(userProfile: any): Promise<any> {
    let user = await User.findOne({ email: userProfile.email });
    if (!user) {
      user = new User({
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.picture ?? "",
      });

      await user.save();
    }

    return user;
  }

  async exchangeWithGoogleIDP(
    request: ExchangeTokenRequest
  ): Promise<ExchangeTokenResult> {
    const { code } = request;
    const googleToken =
      await this.googleIdentityBroker.exchangeAuthorizationCode(code);
    const userProfile = await this.googleIdentityBroker.fetchProfile({
      idToken: googleToken.idToken,
      accessToken: googleToken.accessToken,
    });

    const user = await this.createUserIfNotExists(userProfile);
    const sessionID = uuidv4();
    const jwtPayload = {
      _id: user._id,
      sub: user._id,
      sid: sessionID,
    };
    const accessToken = this.signAccessToken(jwtPayload);
    const refreshToken = this.signRefreshToken(jwtPayload);
    const session = new Session({ sessionID: sessionID, userID: user._id });
    await session.save();

    return {
      refreshToken,
      accessToken,
      sub: String(user._id),
    };
  }

  async logout(refreshToken: string): Promise<string> {
    const jwtClaims = jwt.verify(refreshToken, this.jwtRefreshSecret);
    const sid = jwtClaims["sid"];

    await Session.deleteOne({
      sessionID: sid,
    });
    return "User logged out successfully";
  }

  async refreshToken(token: string): Promise<ExchangeTokenResult> {
    const jwtClaims = this.verifyToken(token, this.jwtRefreshSecret);
    const sessionID = jwtClaims["sid"];
    const subject = jwtClaims["sub"];

    const session = await Session.findOne({ sessionID });
    if (!session) {
      throw new Error("");
    }

    const jwtPayload = {
      _id: jwtClaims["sub"],
      sub: jwtClaims["sub"],
      sid: sessionID,
    };

    const newAccessToken = this.signAccessToken(jwtPayload);
    const newRefreshToken = this.signRefreshToken(jwtPayload);

    return {
      sub: String(subject),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async register(
    email: string,
    password: string,
    name: string,
    avatar: string
  ): Promise<ExchangeTokenResult> {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    password = await bcrypt.hash(password, 10);
    console.log("Password after hashing: ", password);
    const user = new User({
      email,
      password,
      name,
      avatar,
    });
    await user.save();

    const sessionID = uuidv4();
    const jwtPayload = {
      _id: user._id,
      sub: user._id,
      sid: sessionID,
    };
    const accessToken = this.signAccessToken(jwtPayload);
    const refreshToken = this.signRefreshToken(jwtPayload);

    const session = new Session({ sessionID, userID: user._id });
    await session.save();

    return {
      refreshToken,
      accessToken,
      sub: String(user._id),
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<ExchangeTokenResult> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }
    const sessionID = uuidv4();
    const jwtPayload = {
      _id: user._id,
      sub: user._id,
      sid: sessionID,
    };
    const accessToken = this.signAccessToken(jwtPayload);
    const refreshToken = this.signRefreshToken(jwtPayload);
    const session = new Session({ sessionID, userID: user._id });
    await session.save(); 

    return {
      refreshToken,
      accessToken,
      sub: String(user._id),
    };
  }
}

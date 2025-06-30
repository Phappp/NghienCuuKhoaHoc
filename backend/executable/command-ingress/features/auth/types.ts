type ExchangeTokenResult = {
  sub: string;
  refreshToken: string;
  accessToken: string;
};

type ExchangeTokenRequest = {
  code: string;
  idp: string;
};

interface AuthService {
  exchangeWithGoogleIDP(
    request: ExchangeTokenRequest
  ): Promise<ExchangeTokenResult>;
  logout(token: string): Promise<string>;
  refreshToken(token: string): Promise<ExchangeTokenResult>;
  register(
    email: string,
    password: string,
    name: string,
    avatar: string
  ): Promise<ExchangeTokenResult>;
  login(email: string, password: string): Promise<ExchangeTokenResult>;
}

export { AuthService, ExchangeTokenRequest, ExchangeTokenResult };

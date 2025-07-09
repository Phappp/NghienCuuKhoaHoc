/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import env from './utils/env';
import logger from './middlewares/logger';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';

import cors from 'cors';
import { recoverMiddleware } from './middlewares/recover';
import { createServer } from 'http';

import initAuthRoute from './features/auth/adapter/route';
import { AuthController } from './features/auth/adapter/controller';
import { AuthServiceImpl } from './features/auth/domain/service';
import { GoogleIdentityBroker } from './features/auth/identity-broker/google-idp.broker';

import initOcrRoute from './features/ocr/adapter/route';
import { OcrController } from './features/ocr/adapter/controller';
import { OcrService } from './features/ocr/domain/service';

import initReadDocxRoute from './features/read_docx/adapter/route';
import { ReadDocxController } from './features/read_docx/adapter/controller';
import { ReadDocxService } from './features/read_docx/domain/service';

import initSpeechRoute from './features/speech/adapter/route';
import { SpeechController } from './features/speech/adapter/controller';
import { SpeechToTextService } from './features/speech/domain/service';

import initInsightRoute from './features/insight/adapter/route';
import { InsightService } from './features/insight/domain/service';
import { InsightController } from './features/insight/adapter/controller';

import initAllInOneRoute from './features/allinone/adapter/route';

import initDocgenRoute from './features/docgen/adapter/route';


const app = express();

const createHttpServer = (redisClient: any) => {
  const server = createServer(app);

  const isProd = !env.DEV;
  if (isProd) {
    app.use(logger);
  }
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(fileUpload());



  // Construct services
  const googleIdentityBroker = new GoogleIdentityBroker({
    clientID: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectURL: env.GOOGLE_OAUTH_REDIRECT_URL,
  });
  
  const authService = new AuthServiceImpl(
    googleIdentityBroker,
    env.JWT_SECRET,
    env.JWT_REFRESH_SECRET,
  );

  // Setup route
  app.use('/auth', initAuthRoute(new AuthController(authService))); //Xử lý xác thực người dùng
  app.use('/ocr', initOcrRoute(new OcrController(new OcrService()))); //Xử lý ảnh OCR
  app.use('/read_docx', initReadDocxRoute(new ReadDocxController(new ReadDocxService()))); //Đọc file docx
  app.use('/speech', initSpeechRoute(new SpeechController(new SpeechToTextService()))); //Chuyển đổi giọng nói thành văn bản
  app.use('/insight', initInsightRoute(new InsightController(new InsightService()))); //Trích xuất use_case từ văn bản
  app.use('/allinone', initAllInOneRoute()); //Tổng hợp OCR, Speech, Insight
  app.use('/generate-doc', initDocgenRoute()); //Sinh tài liệu UCSD và USSD


  app.use(recoverMiddleware);


  return server;
};

export {
  createHttpServer,
};

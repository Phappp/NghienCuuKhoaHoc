// features/ocr/adapter/route.ts
import { Router } from 'express';
import { OcrController } from './controller';

export default function initOcrRoute(controller: OcrController): Router {
    const router = Router();
    router.post('/process', controller.processImage.bind(controller));
    return router;
}

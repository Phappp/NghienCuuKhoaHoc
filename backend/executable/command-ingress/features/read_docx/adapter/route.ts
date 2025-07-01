import { Router } from 'express';
import { ReadDocxController } from './controller';

export default function initReadDocxRoute(controller: ReadDocxController): Router {
    const router = Router();
    router.post('/process', controller.processDocx.bind(controller));
    return router;
} 
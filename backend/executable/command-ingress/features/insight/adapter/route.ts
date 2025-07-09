import { Router } from 'express';
import { InsightController } from './controller';

export default function initInsightRoute(controller: InsightController) {
    const router = Router();
    router.post('/extract', controller.extractMetadata);
    router.post('/extract-all', controller.extractWithSuggestion);
    return router;
}

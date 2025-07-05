// features/speech/adapter/route.ts
import { Router } from 'express';
import { SpeechController } from './controller';

export default function initSpeechRoute(controller: SpeechController): Router {
    const router = Router();

    router.post('/upload', controller.uploadAudio.bind(controller));

    return router;
}
 
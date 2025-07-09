import { Router } from 'express';
import { generateDocumentJson } from './controller';

export default function initDocgenRoute() {
    const router = Router();
    /**
   * POST /generate-doc/json
   * Body: {
   *   use_cases: [...],
   *   options: { useCaseSpec: boolean, userStory: boolean },
   *   lang: 'vi' | 'en'  // Ngôn ngữ đầu ra (optional)
   * }
   */
    router.post('/json', generateDocumentJson);
    // Có thể mở rộng thêm: router.post('/markdown', ...);

    return router;
} 

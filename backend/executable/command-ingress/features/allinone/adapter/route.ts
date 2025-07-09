// features/allinone/adapter/route.ts
import { Router } from 'express';
import { handleAllInOne } from './controller';

const router = Router();
router.post('/upload', handleAllInOne);

export default function initAllInOneRoute() {
    return router;
}

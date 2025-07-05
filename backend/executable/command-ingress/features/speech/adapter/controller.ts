// features/speech/adapter/controller.ts
import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { SpeechToTextService } from '../../speech/domain/service';

export class SpeechController {
  constructor(private readonly speechService: SpeechToTextService) {}

  async uploadAudio(req: Request, res: Response): Promise<Response> {
    try {
      const files = (req as Request & { files?: { audio?: UploadedFile | UploadedFile[] } }).files?.audio;

      if (!files) {
        return res.status(400).json({ error: 'Missing audio file(s). Field name should be "audio"' });
      }

      const context = typeof req.body.context === 'string' ? req.body.context : '';
      const results = await this.speechService.handleAudio(files, context);

      return res.status(200).json(results);
    } catch (err) {
      console.error('[SpeechController] Error:', err);
      return res.status(500).json({ error: (err as Error).message || 'Internal server error' });
    }
  }
}



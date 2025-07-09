import { Request, Response } from 'express';
import { InsightService } from '../domain/service';

export class InsightController {
  constructor(private insightService: InsightService) { }

  extractMetadata = async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Văn bản không hợp lệ.' });
    }

    try {
      const metadata = await this.insightService.extractMetadata(text);
      res.json(metadata);
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
  };

  extractWithSuggestion = async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Văn bản không hợp lệ.' });
    }

    try {
      // 🔁 Đổi từ extractAll thành extractWithSuggestion
      const result = await this.insightService.extractWithSuggestion(text);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
  };
}

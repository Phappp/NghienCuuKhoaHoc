import { Request, Response } from 'express';
import { DocumentGeneratorService } from '../domain/service';

const generator = new DocumentGeneratorService();

export const generateDocumentJson = async (req: Request, res: Response) => {
  const { use_cases, options } = req.body;

  if (!Array.isArray(use_cases) || use_cases.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid use_cases' });
  }

  try {
    console.log('[REQUEST] use_cases:', JSON.stringify(use_cases, null, 2));
    const sections = await generator.generateToJson(use_cases, options || {});
    res.json(sections);
  } catch (err) {
    console.error('[ERROR] generate-doc/json:', err);
    res.status(500).json({ error: err.toString() });
  }

};


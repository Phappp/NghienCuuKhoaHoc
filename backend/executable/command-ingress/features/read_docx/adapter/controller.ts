import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { ReadDocxService } from '../../read_docx/domain/service';

export class ReadDocxController {
    constructor(private readonly readDocxService: ReadDocxService) {}

    async processDocx(req: Request, res: Response) {
        const files = (req as Request & {
            files?: { docx?: UploadedFile | UploadedFile[] };
        }).files;

        if (!files || !files.docx) {
            return res.status(400).json([{ text: null, confidence: 0, error: 'No docx file uploaded' }]);
        }

        const docxFiles = Array.isArray(files.docx) ? files.docx : [files.docx];
        try {
            const results = await this.readDocxService.handleDocxFiles(docxFiles);
            return res.json(results);
        } catch (error: any) {
            return res.status(500).json([{ text: null, confidence: 0, error: error.message || 'Internal error' }]);
        }
    }
} 
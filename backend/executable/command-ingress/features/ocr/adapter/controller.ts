import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';

export class OcrController {
    constructor(private readonly ocrService: any) { }

    async processImage(req: Request, res: Response) {
        const files = (req as Request & {
            files?: { image?: UploadedFile | UploadedFile[] };
        }).files;

        if (!files || !files.image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const images = Array.isArray(files.image) ? files.image : [files.image];
        const results = await this.ocrService.handleImages(images);
        return res.json(results);
    }
}

import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

export class ReadDocxService {
    async handleDocxFiles(docxFiles: UploadedFile[]): Promise<any[]> {
        const uploadDir = path.join(__dirname, '../../../uploads_docx');
        await fs.mkdir(uploadDir, { recursive: true });

        const results: any[] = [];
        for (const file of docxFiles) {
            const savePath = path.join(uploadDir, file.name);
            await file.mv(savePath);
            try {
                const result = await this.runDocxToText(savePath);
                results.push(result);
            } catch (error: any) {
                results.push({ text: null, confidence: 0, error: error.message || 'Internal error' });
            }
        }
        return results;
    }

    async runDocxToText(docxPath: string): Promise<any> {
        const scriptPath = path.join(__dirname, '../pythonScript/process_docx.py');
        const args = [scriptPath, docxPath];

        return new Promise((resolve, reject) => {
            const python = spawn('python', args);
            let result = '';
            let error = '';

            python.stdout.on('data', (data) => result += data.toString());
            python.stderr.on('data', (data) => error += data.toString());

            python.on('close', (code) => {
                if (code !== 0) return reject(new Error(error));
                try {
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error('Invalid JSON from docx script'));
                }
            });

            python.on('error', (err) => reject(err));
        });
    }
} 
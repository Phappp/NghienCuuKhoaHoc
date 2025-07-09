import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { InsightService } from '../../insight/domain/service';
import { OcrService } from '../../ocr/domain/service';
import { SpeechToTextService } from '../../speech/domain/service';

export class AllInOneService {
    private insightService = new InsightService();
    private ocrService = new OcrService();
    private speechService = new SpeechToTextService();

    async handle(files: { [fieldname: string]: UploadedFile | UploadedFile[] }, context: string): Promise<any> {
        const inputFiles: UploadedFile[] = [];

        // ✅ Chuyển object files → mảng file
        for (const key in files) {
            const value = files[key];
            if (Array.isArray(value)) {
                inputFiles.push(...value);
            } else {
                inputFiles.push(value);
            }
        }

        const ocrFiles: UploadedFile[] = [];
        const speechFiles: UploadedFile[] = [];

        for (const file of inputFiles) {
            if (!file || typeof file.name !== 'string') {
                console.warn('⚠️ File thiếu tên hoặc không hợp lệ:', file);
                continue;
            }
            const ext = path.extname(file.name).toLowerCase();
            if ([".png", ".jpg", ".jpeg", ".bmp", ".webp"].includes(ext)) {
                ocrFiles.push(file);
            } else if ([".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".webm"].includes(ext)) {
                speechFiles.push(file);
            }
        }

        const results: any = {};
        const accepted: any[] = [];
        const suggested: any[] = [];

        if (ocrFiles.length > 0) {
            const ocrResult = await this.ocrService.handleImages(ocrFiles);

            await Promise.all(
                ocrResult.map(async (item) => {
                    if (item?.text && item.text.length > 10) {
                        try {
                            const insight = await this.insightService.extractWithSuggestion(item.text);
                            item.accepted_use_cases = insight.accepted_use_cases ?? [];
                            item.suggested_use_cases = insight.suggested_use_cases ?? [];
                            accepted.push(...item.accepted_use_cases);
                            suggested.push(...item.suggested_use_cases);
                        } catch (e) {
                            item.accepted_use_cases = [];
                            item.suggested_use_cases = [];
                            console.warn('⚠️ Lỗi insight OCR:', e);
                        }
                    } else {
                        item.accepted_use_cases = [];
                        item.suggested_use_cases = [];
                    }
                })
            );

            results.ocr = ocrResult;
        }

        if (speechFiles.length > 0) {
            const sttResult = await this.speechService.handleAudio(speechFiles, context);

            await Promise.all(
                sttResult.map(async (item) => {
                    if (item?.text && item.text.length > 10) {
                        try {
                            const insight = await this.insightService.extractWithSuggestion(item.text);
                            item.accepted_use_cases = insight.accepted_use_cases ?? [];
                            item.suggested_use_cases = insight.suggested_use_cases ?? [];
                            accepted.push(...item.accepted_use_cases);
                            suggested.push(...item.suggested_use_cases);
                        } catch (e) {
                            item.accepted_use_cases = [];
                            item.suggested_use_cases = [];
                            console.warn('⚠️ Lỗi insight STT:', e);
                        }
                    } else {
                        item.accepted_use_cases = [];
                        item.suggested_use_cases = [];
                    }
                })
            );

            results.speech = sttResult;
        }

        results.accepted_use_cases = accepted;
        results.suggested_use_cases = suggested;

        return results;
    }
}

import { UploadedFile } from 'express-fileupload';

declare module 'express-serve-static-core' {
    interface Request {
        files?: {
            docx?: UploadedFile | UploadedFile[];
            [fieldname: string]: UploadedFile | UploadedFile[] | undefined;
        };
    }
} 
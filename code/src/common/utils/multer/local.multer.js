import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileFilter } from './validation.multer.js';

export const localFileUpload = ({
    customPath = 'general',
    validation = [],
    maxSize = 5
}={}
) => { 
    const storage = multer.diskStorage({
        destination: (req, file, cb) => { 
            const fullPath = path.resolve(`../uploads/${customPath}`);
           if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            } 
            cb(null, fullPath);
        },

        filename: (req, file, cb) => { 
            const uniqueFileName = `${randomUUID()}_${file.originalname}`;
            file.finalPath = `uploads/${customPath}/${uniqueFileName}`;
            cb(null, uniqueFileName);
        }
    })

    return multer({fileFilter: fileFilter(validation), storage, limits: { fileSize: maxSize * 1024 * 1024 } });
}
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create storage for different folders
const createStorage = (folder = 'notices') => {
    const uploadsDir = path.join(__dirname, `../uploads/${folder}`);
    
    // Create directory if doesn't exist
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }

    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadsDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${folder}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
};

// File filter - allow more types for assignments
const fileFilter = (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|cpp|java|py|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'text/plain' ||
                     file.mimetype === 'text/x-c++src' ||
                     file.mimetype === 'text/x-python' ||
                     file.mimetype === 'application/x-zip-compressed' ||
                     file.mimetype === 'application/zip' ||
                     file.mimetype === 'application/x-rar-compressed';
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('File type not allowed. Allowed: PDF, DOC, DOCX, TXT, CPP, JAVA, PY, ZIP, RAR, JPG, PNG'));
    }
};

// Default upload for notices (backward compatibility)
export const upload = multer({
    storage: createStorage('notices'),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

// Create custom upload for assignments
export const assignmentUpload = multer({
    storage: createStorage('assignments'),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB for assignments
    },
    fileFilter: fileFilter
});

// Export configurable upload
export const createUpload = (folder = 'notices', maxFiles = 3, maxSize = 10) => {
    return multer({
        storage: createStorage(folder),
        limits: {
            fileSize: maxSize * 1024 * 1024 // maxSize in MB
        },
        fileFilter: fileFilter
    }).array('attachments', maxFiles);
};
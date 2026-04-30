import express from 'express'; import { body, check } from 'express-validator';
import multer from 'multer';
import validateRequest from '../middleware/validator.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WebP files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB size limit
}).single('image');

import { protect, admin } from '../middleware/authMiddleware.js';

router.post('/', protect, admin, upload, (req, res) => {
  if (!req.file)
    throw res.status(400).json({ error: 'No file uploaded' });

  res.send({
    message: 'Image uploaded',
    imageUrl: `/${req.file.path}`
  });
});

export default router;

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Resume storage
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const committeeLogin = req.params.committeeLogin;
    const dir = path.join(uploadsDir, 'resumes', committeeLogin || 'general');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const pgpid = req.user.loginId;
    cb(null, `${pgpid}.pdf`);
  },
});

const resumeFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resumes.'), false);
  }
};

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_RESUME_SIZE_MB, 10) || 5) * 1024 * 1024,
  },
});

// Presentation storage
const presentationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, 'presentations');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const login = req.user.loginId;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${login}${ext}`);
  },
});

const presentationFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and PPTX files are allowed for presentations.'), false);
  }
};

const presentationUpload = multer({
  storage: presentationStorage,
  fileFilter: presentationFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_PRESENTATION_SIZE_MB, 10) || 20) * 1024 * 1024,
  },
});

module.exports = { resumeUpload, presentationUpload };

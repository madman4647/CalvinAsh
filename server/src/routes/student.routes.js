const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { resumeUpload } = require('../middleware/upload');
const studentController = require('../controllers/student.controller');

// All routes require student auth
router.use(auth, roleGuard('student'));

// Profile
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// CCAs
router.get('/ccas', studentController.getCCAs);
router.get('/ccas/:login', studentController.getCCADetail);

// Applications
router.get('/applications', studentController.getApplications);
router.get('/applications/:committeeLogin', studentController.getApplicationDetail);
router.put('/applications/:committeeLogin', studentController.updateApplication);
router.delete('/applications/:committeeLogin', studentController.withdrawApplication);

// Apply (with resume upload)
router.post('/apply/:committeeLogin', resumeUpload.single('resume'), studentController.apply);

// Resume update for existing application
router.put('/applications/:committeeLogin/resume', resumeUpload.single('resume'), studentController.updateApplicationResume);

// Rankings
router.get('/rankings', studentController.getRankings);
router.put('/rankings', studentController.updateRankings);

// Common questions
router.get('/common-questions', studentController.getCommonQuestions);
router.put('/common-answers', resumeUpload.single('general_resume'), studentController.updateCommonAnswers);

// Hostel CCAs and application (before :login param routes)
router.get('/hostel/ccas', studentController.getHostelCCAs);
router.post('/hostel/apply/:committeeLogin', resumeUpload.single('resume'), studentController.applyToHostel);

// Allocation result
router.get('/allocation', studentController.getAllocation);

module.exports = router;

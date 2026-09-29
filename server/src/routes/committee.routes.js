const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { presentationUpload } = require('../middleware/upload');
const committeeController = require('../controllers/committee.controller');

// All routes require committee auth
router.use(auth, roleGuard('committee'));

// Profile
router.get('/profile', committeeController.getProfile);
router.put('/profile', presentationUpload.single('presentation'), committeeController.updateProfile);

// Questions
router.get('/questions', committeeController.getQuestions);
router.put('/questions', committeeController.updateQuestions);

// Export routes must be defined BEFORE :pgpid param routes
router.get('/applications/export/excel', committeeController.exportExcel);
router.get('/applications/export/resumes', committeeController.exportResumes);
router.get('/applications/export/contacts', committeeController.exportContacts);

// Bulk selection must be before :pgpid
router.put('/applications/bulk-selection', committeeController.bulkSelection);

// Applications
router.get('/applications', committeeController.getApplications);
router.get('/applications/:pgpid', committeeController.getApplicantDetail);
router.put('/applications/:pgpid/selection', committeeController.updateSelection);

module.exports = router;

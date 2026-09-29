const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const councilController = require('../controllers/council.controller');

// All routes require council auth
router.use(auth, roleGuard('council'));

// Dashboard
router.get('/dashboard', councilController.getDashboard);

// Committees
router.get('/committees', councilController.getCommittees);
router.get('/committees/:login/applications', councilController.getCommitteeApplications);

// Export must be before param routes
router.get('/export/excel', councilController.exportExcel);
router.get('/export/flat-excel', councilController.exportFlatExcel);

// Common questions management
router.get('/common-questions', councilController.getCommonQuestions);
router.put('/common-questions', councilController.updateCommonQuestions);

// Bulk mail credentials
router.post('/bulk-mail-credentials', councilController.bulkMailCredentials);

// Applications
router.get('/applications', councilController.getAllApplications);
router.get('/applications/:pgpid', councilController.getStudentOverview);
router.put('/applications/:pgpid/:committeeLogin/selection', councilController.overrideSelection);

// Allocation
router.post('/allocate', councilController.runAllocation);
router.get('/allocations', councilController.getAllocations);
router.delete('/allocations', councilController.clearAllocations);

module.exports = router;

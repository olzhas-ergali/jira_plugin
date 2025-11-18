const express = require('express');
const router = express.Router();
const projectAnalyzerController = require('../controllers/projectAnalyzerController');

router.post('/full-analysis', projectAnalyzerController.analyzeFullProject.bind(projectAnalyzerController));

module.exports = router;



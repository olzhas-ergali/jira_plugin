const projectAnalyzer = require('../services/projectAnalyzer');
const Joi = require('joi');

class ProjectAnalyzerController {
  async analyzeFullProject(req, res) {
    try {
      const schema = Joi.object({
        projectKey: Joi.string().required(),
        issueKeys: Joi.array().items(Joi.string()).required(),
        source: Joi.string().optional(),
        timestamp: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details[0].message
        });
      }

      const { projectKey, issueKeys } = value;
      
      console.log(`Full project analysis request: ${projectKey}, ${issueKeys.length} issues`);

      const analysis = await projectAnalyzer.analyzeProject(issueKeys, projectKey);

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Project analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Analysis failed',
        message: error.message
      });
    }
  }
}

module.exports = new ProjectAnalyzerController();



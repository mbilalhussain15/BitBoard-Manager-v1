// ai-PlannerService/routes/taskAgentRoutes.js
import express from 'express'
import * as ctrl from '../controllers/task-agent-controller.js'

const router = express.Router()

router.post('/bulk-generate', ctrl.bulkGenerate)
router.post('/auto-describe', ctrl.autoDescribe)
router.post('/improve', ctrl.improve)

export default router

import express from "express";
import * as ctrl from '../controllers/planner-controller.js'


const router = express.Router();

router.post('/generate', ctrl.createPlan)
// router.post('/approve', ctrl.approve)
// router.get('/status', ctrl.status)
// router.post('/retry', ctrl.retry)
// router.post('/reject', ctrl.reject)



export default router;

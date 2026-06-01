import { Router } from 'express';
import * as reportService from '../services/reports.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', async (req: AuthRequest, res) => {
  const { monthStart } = req.query;
  try { res.json(await reportService.fetchDashboardRawData(req.tenantId!, monthStart as string)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/reports', async (req: AuthRequest, res) => {
  const { monthStart } = req.query;
  try { res.json(await reportService.fetchReportRawData(req.tenantId!, monthStart as string)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;


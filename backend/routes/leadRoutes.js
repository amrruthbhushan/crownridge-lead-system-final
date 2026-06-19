import express from 'express';
import { 
  getAllLeads, getLeadById, createLead, updateLead, deleteLead,
  logCommunication, addDocument
} from '../controllers/leadController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { 
  validateRequest, createLeadSchema, updateLeadSchema, 
  logCommunicationSchema, addDocumentSchema 
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// All lead routes require authentication
router.use(authenticateToken);

router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.post('/', validateRequest(createLeadSchema), createLead);
router.put('/:id', validateRequest(updateLeadSchema), updateLead);
router.delete('/:id', requireRole(['ADMIN']), deleteLead);

// Custom features
router.post('/:id/communications', validateRequest(logCommunicationSchema), logCommunication);
router.post('/:id/documents', validateRequest(addDocumentSchema), addDocument);

export default router;

import { z } from 'zod';

// Reusable custom validation check middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// 1. Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['ADMIN', 'SALES_REP', 'PROJECT_MANAGER', 'TECH_LEAD']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// 2. Lead Schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  industry: z.string().min(1, 'Industry is required'),
  budget: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Budget must be LOW, MEDIUM, or HIGH' })
  }),
  projectSize: z.enum(['SMALL', 'MEDIUM', 'LARGE'], {
    errorMap: () => ({ message: 'Project size must be SMALL, MEDIUM, or LARGE' })
  }),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Urgency must be LOW, MEDIUM, or HIGH' })
  }),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL'], {
    errorMap: () => ({ message: 'Source must be WEBSITE, LINKEDIN, or REFERRAL' })
  }),
  industryFit: z.enum(['POOR', 'GOOD', 'EXCELLENT']).optional().default('GOOD'),
  notes: z.string().optional(),
  estimatedBudget: z.number().int().nonnegative().optional(),
  expectedRevenue: z.number().int().nonnegative().optional(),
  conversionProbability: z.number().int().nonnegative().min(0).max(100).optional()
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  budget: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  projectSize: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL']).optional(),
  industryFit: z.enum(['POOR', 'GOOD', 'EXCELLENT']).optional(),
  notes: z.string().optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  estimatedBudget: z.number().int().nonnegative().optional(),
  expectedRevenue: z.number().int().nonnegative().optional(),
  conversionProbability: z.number().int().nonnegative().min(0).max(100).optional(),
  
  // Checklist fields
  budgetConfirmed: z.boolean().optional(),
  decisionMakerIdentified: z.boolean().optional(),
  timelineConfirmed: z.boolean().optional(),
  requirementsCollected: z.boolean().optional(),
  proposalSent: z.boolean().optional(),
  
  // Assignment fields
  assignedToId: z.string().nullable().optional(),
  assignmentNotes: z.string().optional()
});

// 3. Custom Features Schemas
export const logCommunicationSchema = z.object({
  type: z.enum(['EMAIL', 'CALL', 'MEETING', 'CHAT'], {
    errorMap: () => ({ message: 'Type must be EMAIL, CALL, MEETING, or CHAT' })
  }),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required')
});

export const addDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  fileSize: z.string().min(1, 'File size is required'),
  fileType: z.string().min(1, 'File type is required')
});

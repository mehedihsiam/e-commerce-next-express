import express from 'express';
import verifyToken from '../../middlewares/verifyToken.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import getAllSettings from './getAllSettings.js';
import getPublicSettings from './getPublicSettings.js';
import updateStoreSettings from './updateStoreSettings.js';
import updateContactSettings from './updateContactSettings.js';
import updateFinancialSettings from './updateFinancialSettings.js';
import updateShippingSettings from './updateShippingSettings.js';
import updateSEOSettings from './updateSEOSettings.js';
import updateSecuritySettings from './updateSecuritySettings.js';
import updateMaintenanceSettings from './updateMaintenanceSettings.js';
import updateUserExperienceSettings from './updateUserExperienceSettings.js';

const router = express.Router();

// Public route - Get public settings (no authentication required)
router.get('/public', getPublicSettings);

// Admin routes - All modification routes require admin authentication
router.use(verifyToken, verifyAdmin);

// Get all settings (admin only)
router.get('/', getAllSettings);

// Update specific setting sections (admin only)
router.patch('/store', updateStoreSettings);
router.patch('/contact', updateContactSettings);
router.patch('/financial', updateFinancialSettings);
router.patch('/shipping', updateShippingSettings);
router.patch('/seo', updateSEOSettings);
router.patch('/security', updateSecuritySettings);
router.patch('/maintenance', updateMaintenanceSettings);
router.patch('/user-experience', updateUserExperienceSettings);

export default router;

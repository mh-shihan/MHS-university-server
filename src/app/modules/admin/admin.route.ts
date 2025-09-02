import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { AdminController } from './admin.controller';
import { AdminValidations } from './admin.validation';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get(
  '/',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  AdminController.getAllAdmin,
);

router.get(
  '/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  AdminController.getSingleAdmin,
);

router.patch(
  '/:id',
  auth(USER_ROLE.superAdmin),
  validateRequest(AdminValidations.updateAdminValidationSchema),
  AdminController.updateAdmin,
);

router.delete(
  '/:id',
  auth(USER_ROLE.superAdmin),
  AdminController.deleteSingleAdmin,
);

export const AdminRoutes = router;

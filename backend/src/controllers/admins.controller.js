import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import { hashPassword } from '../utils/password.js';
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  findAdminById,
  emailTaken,
  countActiveSuperadmins,
} from '../models/admin.model.js';

/** Load the target admin or 404. */
async function loadTarget(id) {
  const admin = await findAdminById(id);
  if (!admin) throw ApiError.notFound('অ্যাডমিন পাওয়া যায়নি।', 'ADMIN_NOT_FOUND');
  return admin;
}

/**
 * Refuse a change that would leave no active superadmin — otherwise nobody could ever
 * manage admins again and the panel would need direct DB access to recover.
 */
async function assertNotLastSuperadmin(target) {
  if (target.role !== 'superadmin' || !target.is_active) return;
  const others = await countActiveSuperadmins(target.id);
  if (others === 0) {
    throw ApiError.badRequest(
      'অন্তত একজন সক্রিয় সুপার অ্যাডমিন থাকতে হবে।',
      'LAST_SUPERADMIN',
    );
  }
}

export const list = asyncHandler(async (req, res) => {
  return ok(res, await listAdmins());
});

export const create = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (await emailTaken(email)) {
    throw ApiError.conflict('এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।', 'EMAIL_TAKEN');
  }

  const admin = await createAdmin({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
  });
  return created(res, admin);
});

export const update = asyncHandler(async (req, res) => {
  const target = await loadTarget(req.params.id);
  const isSelf = String(target.id) === String(req.admin.id);
  const { role, is_active: isActive } = req.body;

  // Self-protection: you cannot demote or disable your own account, which would
  // instantly revoke the session you are using to make the change.
  if (isSelf && role !== undefined && role !== target.role) {
    throw ApiError.badRequest('নিজের ভূমিকা পরিবর্তন করা যাবে না।', 'CANNOT_CHANGE_OWN_ROLE');
  }
  if (isSelf && isActive === false) {
    throw ApiError.badRequest('নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।', 'CANNOT_DEACTIVATE_SELF');
  }

  const losesSuperadmin = role !== undefined && role !== 'superadmin';
  if (losesSuperadmin || isActive === false) await assertNotLastSuperadmin(target);

  return ok(res, await updateAdmin(target.id, req.body));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const target = await loadTarget(req.params.id);
  await updateAdminPassword(target.id, await hashPassword(req.body.new_password));
  return ok(res, { message: `${target.name}-এর পাসওয়ার্ড পরিবর্তন হয়েছে।` });
});

export const remove = asyncHandler(async (req, res) => {
  const target = await loadTarget(req.params.id);

  if (String(target.id) === String(req.admin.id)) {
    throw ApiError.badRequest('নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না।', 'CANNOT_DELETE_SELF');
  }
  await assertNotLastSuperadmin(target);

  await deleteAdmin(target.id);
  return ok(res, { message: 'অ্যাডমিন মুছে ফেলা হয়েছে।' });
});

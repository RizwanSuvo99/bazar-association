import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import * as Settings from '../models/settings.model.js';

export const getPublic = asyncHandler(async (req, res) => {
  return ok(res, await Settings.getSettings());
});

export const update = asyncHandler(async (req, res) => {
  return ok(res, await Settings.updateSettings(req.body));
});

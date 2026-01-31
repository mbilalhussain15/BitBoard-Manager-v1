// workspaceService/utils/member-utils.js
// Complete file (rewritten).
// Fixes: ensure we always return ObjectId arrays for assignee and reporter.

import mongoose from "mongoose";
import UserView from "../models/user-view.js";

export async function resolveUserViewId(anyId) {
  if (!anyId) return null;
  // try as userView _id
  const byUv = await UserView.findOne({ _id: anyId }, { _id: 1, userId: 1 }).lean();
  if (byUv) return { userViewId: byUv._id, userId: byUv.userId };
  // try as userId
  const byUser = await UserView.findOne({ userId: anyId }, { _id: 1, userId: 1 }).lean();
  if (byUser) return { userViewId: byUser._id, userId: byUser.userId };
  // fallback: trust it is an ObjectId looking value
  const oid = new mongoose.Types.ObjectId(String(anyId));
  return { userViewId: oid, userId: oid };
}

export function toObjectIdArray(any) {
  if (!any) return [];
  const arr = Array.isArray(any) ? any : [any];
  const out = [];
  for (const v of arr) {
    const id = typeof v === "object" && v?.user ? v.user : v;
    try { out.push(new mongoose.Types.ObjectId(String(id))); } catch {}
  }
  return out;
}

// If you need to infer from HTTP actor headers
export function pickAssigneeAndReporterFromActor(req) {
  const actorUvId = req.headers["x-actor-userview-id"];
  // Return arrays of ObjectId, not objects
  const assignee = actorUvId ? [ new mongoose.Types.ObjectId(String(actorUvId)) ] : [];
  const reporter = actorUvId ? [ new mongoose.Types.ObjectId(String(actorUvId)) ] : [];
  return { assignee, reporter };
}

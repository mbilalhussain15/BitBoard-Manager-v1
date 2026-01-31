// workspaceService/utils/actor.js
import UserView from "../models/user-view.js";

export async function buildActorMember(userId, role = "contributor") {
  if (!userId) return null;
  const uv = await UserView.findOne({ userId });
  if (!uv) return null;
  return { user: uv._id, userId, role };
}

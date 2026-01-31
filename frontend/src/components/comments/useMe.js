import { useAuth } from "../../provider/auth-context";
// apne project ke hisaab se path set karo
import { getInitials } from "../../utils/index"; 

export default function useMe() {
  const { user } = useAuth();

  const name = user?.fullName || user?.name || "User";
  const id =
    user?._id || user?.id || user?.userId || "";

  const base = {
    id,
    name,
    initials: getInitials(name),
    user, // pura raw user object store
  };

  // members ko sirf tab include karo jab array ho aur length > 0
  if (Array.isArray(user?.members) && user.members.length) {
    const mapped = user.members
      .map((u) => ({
        id: u._id || u.id,
        name: u.fullName || u.name,
        avatarUrl: u.avatarUrl,
      }))
      .filter((u) => u.id && u.name);

    if (mapped.length) {
      base.members = mapped;
    }
  }

  return base;
}

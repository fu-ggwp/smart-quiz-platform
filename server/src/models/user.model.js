export const USER_TABLE = "users";
const tableName = USER_TABLE;

export const userColumns = {
  userId: "user_id",
  email: "email",
  username: "username",
  fullName: "full_name",
  phoneNumber: "phone_number",
  avatarUrl: "avatar_url",
  bio: "bio",
  accountStatus: "account_status",
  activeRole: "active_role",
  isPremium: "is_premium",
  createdAt: "created_at",
  updatedAt: "updated_at",
  deletedAt: "deleted_at",
};

export function createUserModel(db) {
  return {
    tableName,

    toInsert({ userId, email, username, fullName }) {
      return {
        [userColumns.userId]: userId,
        [userColumns.email]: email,
        [userColumns.username]: username,
        [userColumns.fullName]: fullName,
        [userColumns.accountStatus]: "active",
        [userColumns.activeRole]: "learner",
      };
    },

    toPublic(row) {
      if (!row) return null;

      return {
        userId: row[userColumns.userId],
        email: row[userColumns.email],
        username: row[userColumns.username],
        fullName: row[userColumns.fullName],
        phoneNumber: row[userColumns.phoneNumber],
        avatarUrl: row[userColumns.avatarUrl],
        bio: row[userColumns.bio],
        accountStatus: row[userColumns.accountStatus],
        activeRole: row[userColumns.activeRole],
        isPremium: row[userColumns.isPremium],
        createdAt: row[userColumns.createdAt],
        updatedAt: row[userColumns.updatedAt],
      };
    },

    async findByEmail(email) {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .eq(userColumns.email, email)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async findById(userId) {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .eq(userColumns.userId, userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async findByUsername(username) {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .eq(userColumns.username, username)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data, error } = await db
        .from(tableName)
        .insert(this.toInsert(payload))
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  };
}

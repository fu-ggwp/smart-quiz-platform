const tableName = "user_roles";

export const userRoleColumns = {
  userId: "user_id",
  role: "role",
  createdAt: "created_at",
};

export function createUserRoleModel(db) {
  return {
    tableName,

    toInsert({ userId, role = "learner" }) {
      return {
        [userRoleColumns.userId]: userId,
        [userRoleColumns.role]: role,
      };
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

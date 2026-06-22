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

    async findByUserAndRole(userId, role) {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .eq(userRoleColumns.userId, userId)
        .eq(userRoleColumns.role, role)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async ensure(userId, role) {
      const existing = await this.findByUserAndRole(userId, role);
      if (existing) return existing;

      const { data, error } = await db
        .from(tableName)
        .upsert(this.toInsert({ userId, role }), {
          onConflict: `${userRoleColumns.userId},${userRoleColumns.role}`,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  };
}

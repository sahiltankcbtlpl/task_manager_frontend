/**
 * Checks if a user has a specific permission.
 * @param {Object} user - The user object from AuthContext
 * @param {String} permission - The permission string to check
 * @returns {Boolean}
 */
export const hasPermission = (user, permission) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;

    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.some(p => {
            const val = (typeof p === 'object' && p !== null) ? p.value : p;
            return val === permission;
        });
    }

    return false;
};

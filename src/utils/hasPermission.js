

/**
 * Checks if a user has a specific permission based on their role.
 * @param {Object} user - The user object containing the role.
 * @param {string} permission - The permission to check.
 * @returns {boolean} - True if the user has the permission, false otherwise.
 */
const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;

    // Super Admin bypass
    if (user.role === 'Super Admin') return true;

    // Check dynamic permissions from DB (populated in AuthContext)
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.some(p => p.value === permission);
    }

    return false;
};

export default hasPermission;

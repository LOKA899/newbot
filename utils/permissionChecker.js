const config = require('../config');

class PermissionChecker {
    static hasPermission(member, command) {
        // Admin role has access to everything
        if (member.roles.cache.has(config.adminRoleId)) {
            return true;
        }

        // Check moderator permissions
        if (member.roles.cache.has(config.moderatorRoleId)) {
            return config.rolePermissions.moderator.includes(command);
        }

        // Check participant permissions
        if (member.roles.cache.has(config.participantRoleId)) {
            return config.rolePermissions.participant.includes(command);
        }

        return false;
    }

    static getHighestRole(member) {
        if (member.roles.cache.has(config.adminRoleId)) return 'admin';
        if (member.roles.cache.has(config.moderatorRoleId)) return 'moderator';
        if (member.roles.cache.has(config.participantRoleId)) return 'participant';
        return 'none';
    }

    static getMissingPermissionMessage(command) {
        return `You do not have permission to use the \`${command}\` command. Please contact an administrator if you believe this is a mistake.`;
    }
}

module.exports = PermissionChecker;

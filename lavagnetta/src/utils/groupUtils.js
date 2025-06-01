export const ROLES = {
    ADMIN: 'admin',
    LEVEL1: 'level1',
    LEVEL2: 'level2'
};

// Controlli dei permessi per i ruoli
export const canCreateBoards = (role) => {
    return ['admin', 'level1'].includes(role);
};

export const canModifyBoard = (userRole, isDefaultBoard) => {
    if (isDefaultBoard) return userRole === ROLES.ADMIN;
    return [ROLES.ADMIN, ROLES.LEVEL1].includes(userRole);
};

export const canDeleteBoard = (userRole, isDefaultBoard) => {
    if (isDefaultBoard) return false;
    return userRole === ROLES.ADMIN;
};

export function canEditProduct(role) {
    return role === ROLES.ADMIN || role === ROLES.LEVEL1 || role === ROLES.LEVEL2;
}

export function canChangeBoardBackground(role, isDefault) {
    return (role === ROLES.ADMIN || role === ROLES.LEVEL1) && !isDefault;
}

export function canManageGroup(role) {
    return role === ROLES.ADMIN;
}

export function canManageProducts(role) {
    return role === ROLES.ADMIN || role === ROLES.LEVEL1 || role === ROLES.LEVEL2;
}

export function canManageBoard(role, isDefault) {
    return (role === ROLES.ADMIN || role === ROLES.LEVEL1) && !isDefault;
}

export function requiresAdminTransfer(currentUserRole, adminCount) {
    return currentUserRole === ROLES.ADMIN && adminCount === 1;
}

export function canTransferOwnership(currentUserRole, targetUserRole) {
    return currentUserRole === ROLES.ADMIN && targetUserRole !== ROLES.ADMIN;
}

export function canLeaveGroup(currentUserRole, adminCount) {
    return currentUserRole !== ROLES.ADMIN || adminCount > 1;
}

export function getNextAvailableAdmin(members, currentUserId) {
    return members.find(member =>
        member.role === ROLES.ADMIN && member.id !== currentUserId
    );
}

// Funzione per verificare i permessi in base al ruolo
export const checkPermissions = (userRole, requiredRole) => {
    const roles = {
        'admin': 3,
        'level1': 2,
        'level2': 1
    };

    return roles[userRole] >= roles[requiredRole];
};

export function canDeleteGroup(userRole) {
    return userRole === ROLES.ADMIN;
}

export function canModifyDefaultBoard(userRole) {
    return userRole === ROLES.ADMIN;
}

export function canInviteMembers(userRole) {
    return userRole === ROLES.ADMIN;
}

// Aggiunta controlli specifici per i prodotti
export function canEditProductsBoardType(role, isDefaultBoard) {
    if (isDefaultBoard) {
        return ['admin', 'level1', 'level2'].includes(role);
    }
    return ['admin', 'level1'].includes(role);
}

export function canHighlightProduct(role) {
    return ['admin', 'level1', 'level2'].includes(role);
}

// Aggiunta verifica tracciamento modifiche
export function getLastModifier(product) {
    return {
        userId: product.lastModifiedBy,
        timestamp: product.lastModifiedAt
    };
};

// Aggiungere funzione per verificare permessi backend
export const getBackendPermissions = (role, group = null) => {
    if (group) return group.permissions || [];

    switch (role) {
        case ROLES.ADMIN: return 'admin';
        case ROLES.LEVEL1: return 'level_one';
        case ROLES.LEVEL2: return 'level_two';
        default: return 'level_two';
    }
};

export const formatGroupData = (group) => {
    return {
        ...group,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt)
    };
};

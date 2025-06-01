// backend/middleware/permissionMiddleware.js

const groupService = require('../services/groupServices/groupService');

/**
 * Middleware per verificare i permessi dell'utente in un gruppo.
 * @param  {...string} allowedRoles - Ruoli consentiti (es. 'admin', 'level1', 'level2').
 */
const permit = (...permittedRoles) => {
    return (req, res, next) => {
        const { role } = req.user; // Assumendo che `req.user` sia impostato da `authMiddleware`
        if (permittedRoles.includes(role)) {
            next(); // Il ruolo è permesso, continua al prossimo middleware
        } else {
            res.status(403).json({ message: 'Forbidden' }); // Utente non autorizzato
        }
    };
};

module.exports = permit;

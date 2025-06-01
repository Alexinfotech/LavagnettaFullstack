const db = require('../config/db');

class GroupMemberService {
    async addMember(groupId, userId, role = 'member') {
        try {
            const query = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
            const [result] = await db.execute(query, [groupId, userId, role]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async removeMember(groupId, userId) {
        try {
            const query = 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?';
            const [result] = await db.execute(query, [groupId, userId]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getGroupMembers(groupId) {
        try {
            const query = `
                SELECT u.id, u.username, u.email, gm.role 
                FROM users u 
                JOIN group_members gm ON u.id = gm.user_id 
                WHERE gm.group_id = ?
            `;
            const [members] = await db.execute(query, [groupId]);
            return members;
        } catch (error) {
            throw error;
        }
    }

    async updateMemberRole(groupId, userId, newRole) {
        try {
            const query = 'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?';
            const [result] = await db.execute(query, [newRole, groupId, userId]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new GroupMemberService();

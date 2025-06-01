// backend/controllers/groupMemberController.js

const groupMemberService = require('../services/groupMemberService');

const groupMemberController = {
    async addMember(req, res) {
        try {
            const { groupId } = req.params;
            const { userId, role } = req.body;
            const result = await groupMemberService.addMember(groupId, userId, role);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async removeMember(req, res) {
        try {
            const { groupId, userId } = req.params;
            const result = await groupMemberService.removeMember(groupId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async getGroupMembers(req, res) {
        try {
            const { groupId } = req.params;
            const members = await groupMemberService.getGroupMembers(groupId);
            res.status(200).json(members);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async updateMemberRole(req, res) {
        try {
            const { groupId, userId } = req.params;
            const { role } = req.body;
            const result = await groupMemberService.updateMemberRole(groupId, userId, role);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = groupMemberController;
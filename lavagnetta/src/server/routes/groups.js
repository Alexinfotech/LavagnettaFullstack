
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');

// GET /api/groups - Ottieni tutti i gruppi
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei gruppi' });
    }
});

// POST /api/groups - Crea un nuovo gruppo
router.post('/', auth, async (req, res) => {
    try {
        const group = new Group({
            name: req.body.name,
            description: req.body.description,
            creator: req.user.id,
            members: [req.user.id]
        });
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ message: 'Errore nella creazione del gruppo' });
    }
});

module.exports = router;
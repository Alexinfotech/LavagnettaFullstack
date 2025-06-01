// src/routes/noteRoutes.js

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

// Applica il middleware di autenticazione a tutte le rotte
router.use(authMiddleware);

// Rotte per le note
router.get('/', noteController.getNotes); // GET /api/auth/notes
router.post('/', noteController.createNote); // POST /api/auth/notes
router.put('/:id', noteController.updateNote); // PUT /api/auth/notes/:id
router.delete('/:id', noteController.deleteNote); // DELETE /api/auth/notes/:id

module.exports = router;

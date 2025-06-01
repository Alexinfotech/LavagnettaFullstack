const pool = require('../../config/db');

const updateBoard = async (userId, boardId, fieldsToUpdate) => {
    const fields = [];
    const values = [];

    if (fieldsToUpdate.name !== undefined) {
        fields.push('name = ?');
        values.push(fieldsToUpdate.name);
    }
    if (fieldsToUpdate.background !== undefined) {
        fields.push('background = ?');
        values.push(fieldsToUpdate.background);
    }
    if (fieldsToUpdate.is_default !== undefined) {
        if (fieldsToUpdate.is_default) {
            await pool.execute(
                'UPDATE boards SET is_default = 0 WHERE user_id = ? AND is_default = 1',
                [userId]
            );
        }
        fields.push('is_default = ?');
        values.push(fieldsToUpdate.is_default ? 1 : 0);
    }

    if (fields.length === 0) {
        return await getBoardById(userId, boardId);
    }

    values.push(boardId, userId);

    const [result] = await pool.execute(
        `UPDATE boards SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values
    );

    if (result.affectedRows === 0) {
        return null;
    }

    const [board] = await pool.execute('SELECT * FROM boards WHERE id = ?', [boardId]);
    return board[0];
};

module.exports = {
    updateBoard
};

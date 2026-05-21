const db = require('../config/db');
const { success, error } = require('../utils/response');

exports.getAll    = async (req, res) => {
  try { const [r] = await db.query('SELECT * FROM brands'); return success(res, r); }
  catch (err) { return error(res, err.message); }
};
exports.create    = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'name is required', 400);
    const [r] = await db.query('INSERT INTO brands (name) VALUES (?)', [name]);
    return success(res, { id: r.insertId, name }, 'Brand created', 201);
  } catch (err) { return error(res, err.message); }
};
exports.update    = async (req, res) => {
  try {
    const { name } = req.body;
    await db.query('UPDATE brands SET name = ? WHERE id = ?', [name, req.params.id]);
    return success(res, { id: Number(req.params.id), name });
  } catch (err) { return error(res, err.message); }
};
exports.remove    = async (req, res) => {
  try {
    await db.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Brand deleted');
  } catch (err) { return error(res, err.message); }
};

const authService = require('../services/authService');

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  const result = await authService.login(email, password);
  res.status(200).json(result);
};

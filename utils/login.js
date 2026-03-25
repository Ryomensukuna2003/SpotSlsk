const axios = require('axios');
const SLSKD_BASE = 'http://localhost:5030';

async function loginToken(username, password) {
    const res = await axios.post(`${SLSKD_BASE}/api/v0/session`, {
      username: username,
      password: password
    });
    // return res.data.token;
    return axios.create({
        baseURL: SLSKD_BASE,
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
  }

module.exports = { loginToken };
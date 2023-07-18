const axios = require('axios')
module.exports = () => {
  const instance = axios.create({})
  return instance
}

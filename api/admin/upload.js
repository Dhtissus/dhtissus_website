const { handleAdminUpload } = require('../../lib/admin-upload');

module.exports = handleAdminUpload;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

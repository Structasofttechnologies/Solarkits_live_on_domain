const check_permissions = (permissionChecks) => {
  return async (req, res, next) => {
    try {
      if (!req.query.req_for || !req.query.unique_id) {
        return next();
      }
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      next();
    }
  };
};

module.exports = check_permissions;

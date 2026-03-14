const roleMiddleware = (...roles) => {

  return (req, res, next) => {

    try {

      const user = req.user;

      if (!roles.includes(user.role) || (user.role==="admin" && req?.body?.user_type==="super_admin")) {
        return res.status(403).json({
          message: "You are not allowed to access this resource."
        });
      }

      next();

    } catch (error) {

      return res.status(500).json({
        message: "Something went wrong."
      });

    }

  };

};

module.exports = roleMiddleware;
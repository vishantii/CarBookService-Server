const config = require("../../config");
const jwt = require("jsonwebtoken");
const Customer = require("../customer/model");

module.exports = {
  isLoginAdmin: (req, res, next) => {
    if (req.session.user === null || req.session.user === undefined) {
      req.flash(
        "alertMessage",
        `Mohon maaf session anda telah habis silahkan login kembali`
      );
      req.flash("alertStatus", "danger");
      res.redirect("/");
    } else {
      next();
    }
  },

  isLoginCustomer: async (req, res, next) => {
    try {
      const token = req.headers.authorization
        ? req.headers.authorization.replace("Bearer ", "")
        : null;

      const data = jwt.verify(token, config.jwtKey);

      const customer = await Customer.findOne({ _id: data.customer.id });

      if (!customer) {
        throw new Error();
      }

      req.customer = customer;
      req.token = token;
      next();
    } catch (err) {
      res.status(401).json({
        error: "Not authorized to acces this resource",
      });
    }
  },
};

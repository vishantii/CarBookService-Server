const Transaction = require("../transaction/model");
const Customer = require("../customer/model");
const Category = require("../category/model");

module.exports = {
  index: async (req, res) => {
    try {
      const transaction = await Transaction.countDocuments();
      const customer = await Customer.countDocuments();
      const category = await Category.countDocuments();
      res.render("admin/dashboard/view_dashboard", {
        name: req.session.user.name,
        title: "Halaman Dashboard",
        count: {
          transaction,
          customer,
          category,
        },
      });
    } catch (err) {
      console.log(err);
    }
  },
};

const Carmake = require("./model");

module.exports = {
  index: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");

      const alert = { message: alertMessage, status: alertStatus };
      const carmake = await Carmake.find();

      res.render("admin/carmake/view_carmake", {
        carmake,
        alert,
        name: req.session.user.name,
        title: "Halaman Carmake",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },
  viewCreate: async (req, res) => {
    try {
      res.render("admin/carmake/create", {
        name: req.session.user.name,
        title: "Halaman tambah Carmake",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },
  actionCreate: async (req, res) => {
    try {
      const { Make, Model, Category, Year, objectId } = req.body;

      let carmakes = await Carmake({ Make, Model, Category, Year, objectId });
      await carmakes.save();

      req.flash("alertMessage", "Berhasil tambah kategori");
      req.flash("alertStatus", "success");

      res.redirect("/carmake");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },

  viewEdit: async (req, res) => {
    try {
      const { id } = req.params;

      const carMake = await Carmake.findOne({ _id: id });

      res.render("admin/carmake/edit", {
        carMake,
        name: req.session.user.name,
        title: "Halaman ubah carmake",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },

  actionEdit: async (req, res) => {
    try {
      const { id } = req.params;
      const { Make, Model, Category, Year, objectId } = req.body;

      await Carmake.findOneAndUpdate(
        {
          _id: id,
        },
        { Make, Model, Category, Year, objectId }
      );

      req.flash("alertMessage", "Berhasil ubah kategori");
      req.flash("alertStatus", "success");

      res.redirect("/carmake");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },

  actionDelete: async (req, res) => {
    try {
      const { id } = req.params;

      await Carmake.findOneAndRemove({
        _id: id,
      });

      req.flash("alertMessage", "Berhasil hapus kategori");
      req.flash("alertStatus", "success");

      res.redirect("/carmake");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/carmake");
    }
  },
};

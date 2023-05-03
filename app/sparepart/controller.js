const Sparepart = require("./model");

module.exports = {
  index: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");
      const { id } = req.query;

      const alert = { message: alertMessage, status: alertStatus };
      let sparepart;

      if (id) {
        sparepart = await Sparepart.find({ _id: id });
      } else {
        sparepart = await Sparepart.find();
      }

      // check if stock is 0, and set the status to N
      for (const part of sparepart) {
        if (part.stock === 0) {
          part.status = "N";
          await part.save();
        }
      }

      res.render("admin/sparepart/view_sparepart", {
        sparepart,
        alert,
        name: req.session.user.name,
        price: req.session.user.price,
        stock: req.session.user.stock, // fix typo
        title: "Halaman Sparepart",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },

  viewCreate: async (req, res) => {
    try {
      res.render("admin/sparepart/create", {
        name: req.session.user.name,
        price: req.session.user.price,
        price: req.session.user.stock,
        title: "Halaman tambah sparepart",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },

  actionCreate: async (req, res) => {
    try {
      const { name, price, stock } = req.body;

      let sparepart = await Sparepart({ name, price, stock });
      await sparepart.save();

      req.flash("alertMessage", "Berhasil tambah sparepart");
      req.flash("alertStatus", "success");

      res.redirect("/sparepart");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },

  viewEdit: async (req, res) => {
    try {
      const { id } = req.params;

      const sparepart = await Sparepart.findOne({ _id: id });

      res.render("admin/sparepart/edit", {
        sparepart,
        name: req.session.user.name,
        price: req.session.user.price,
        price: req.session.user.stock,
        title: "Halaman ubah sparepart",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },

  actionEdit: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, stock } = req.body;

      await Sparepart.findOneAndUpdate(
        {
          _id: id,
        },
        { name, price, stock }
      );

      req.flash("alertMessage", "Berhasil ubah sparepart");
      req.flash("alertStatus", "success");

      res.redirect("/sparepart");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },

  actionDelete: async (req, res) => {
    try {
      const { id } = req.params;

      await Sparepart.findOneAndRemove({
        _id: id,
      });

      req.flash("alertMessage", "Berhasil hapus sparepart");
      req.flash("alertStatus", "success");

      res.redirect("/sparepart");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },
  actionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      let sparepart = await Sparepart.findOne({ _id: id });

      let status = sparepart.status === "Y" ? "N" : "Y";

      sparepart = await Sparepart.findOneAndUpdate(
        {
          _id: id,
        },
        { status }
      );

      req.flash("alertMessage", "Berhasil ubah status");
      req.flash("alertStatus", "success");

      res.redirect("/sparepart");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/sparepart");
    }
  },
};

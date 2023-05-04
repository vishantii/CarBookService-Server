const Transaction = require("./model");
const Schedule = require("../schedule/model");

module.exports = {
  index: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");

      const alert = { message: alertMessage, status: alertStatus };
      const currentDate = new Date().toISOString().slice(0, 10); // mendapatkan tanggal hari ini

      let transactionQuery = Transaction.find({
        chooseDate: currentDate,
        "category.name": "Servis Ringan", // filter based on the category name
      }).populate("userId");

      const date = req.query.date;

      if (date) {
        transactionQuery = transactionQuery.where({ chooseDate: date });
      }

      const transactions = await transactionQuery
        .populate({
          path: "spareparts.sparepartId",
          select: "name price",
        })
        .sort({ chooseTime: -1, chooseDate: 1 })
        .exec();

      const sortedTransactions = [];

      let currentTransactionDate = null;
      let currentTransactionTime = null;

      for (const transaction of transactions) {
        if (
          currentTransactionDate !== transaction.chooseDate ||
          currentTransactionTime !== transaction.chooseTime
        ) {
          currentTransactionDate = transaction.chooseDate;
          currentTransactionTime = transaction.chooseTime;
          sortedTransactions.push([transaction]);
        } else {
          sortedTransactions[sortedTransactions.length - 1].push(transaction);
        }
      }

      const flattenedTransactions = sortedTransactions.flat();

      res.render("admin/transaction/view_transaction", {
        transaction: flattenedTransactions,
        alert,
        name: req.session.user.name,
        title: "Halaman Transaksi",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction");
    }
  },
  secondIndex: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");

      const alert = { message: alertMessage, status: alertStatus };
      const currentDate = new Date().toISOString().slice(0, 10); // mendapatkan tanggal hari ini

      let transactionQuery = Transaction.find({
        chooseDate: currentDate,
        "category.name": "Servis Berat", // filter based on the category name
      }).populate("userId");

      const date = req.query.date;

      if (date) {
        transactionQuery = transactionQuery.where({ chooseDate: date });
      }

      const transactions = await transactionQuery
        .populate({
          path: "spareparts.sparepartId",
          select: "name price",
        })
        .sort({ chooseTime: -1, chooseDate: 1 })
        .exec();

      const sortedTransactions = [];

      let currentTransactionDate = null;
      let currentTransactionTime = null;

      for (const transaction of transactions) {
        if (
          currentTransactionDate !== transaction.chooseDate ||
          currentTransactionTime !== transaction.chooseTime
        ) {
          currentTransactionDate = transaction.chooseDate;
          currentTransactionTime = transaction.chooseTime;
          sortedTransactions.push([transaction]);
        } else {
          sortedTransactions[sortedTransactions.length - 1].push(transaction);
        }
      }

      const flattenedTransactions = sortedTransactions.flat();

      res.render("admin/transaction/view_transaction", {
        transaction: flattenedTransactions,
        alert,
        name: req.session.user.name,
        title: "Halaman Transaksi",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction");
    }
  },

  actionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.query;

      // If the status is being updated to 4, update the availability
      if (status == 4) {
        const transaction = await Transaction.findById(id);
        const date = new Date(transaction.chooseDate);
        const time = transaction.chooseTime;

        const availability = await Schedule.findOne({ date });
        if (availability) {
          const timeIndex = availability.times.findIndex((t) => t.time == time);
          if (timeIndex >= 0) {
            availability.times[timeIndex].available = true;
            await availability.save();
          }
        }
      }

      await Transaction.findByIdAndUpdate({ _id: id }, { status });

      req.flash("alertMessage", `Berhasil ubah status`);
      req.flash("alertStatus", "success");
      res.redirect("/transaction");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction");
    }
  },
  actionDelete: async (req, res) => {
    try {
      const { id } = req.params;

      await Transaction.findByIdAndDelete({ _id: id });

      req.flash("alertMessage", `Berhasil Hapus Transaksi`);
      req.flash("alertStatus", "success");
      res.redirect("/transaction");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction");
    }
  },
};

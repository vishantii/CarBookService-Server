const Transaction = require("./model");
const Schedule = require("../schedule/model");
const moment = require("moment-timezone");

module.exports = {
  index: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");

      const alert = { message: alertMessage, status: alertStatus };

      const currentDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD"); // mendapatkan tanggal hari ini di zona waktu Jakarta

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

      const currentDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD"); // mendapatkan tanggal hari ini di zona waktu Jakarta

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
  // invoice: async (req, res) => {
  //   // Get the transaction details from the request
  //   const transaction = req.body;

  //   // Generate a unique name for the invoice
  //   const date = new Date();
  //   const fileName = `invoice_${date.getTime()}.pdf`;
  //   const directoryPath = "Utils/Invoice/files";

  //   // Generate the invoice PDF using PDFKit
  //   const doc = createInvoicePDF(transaction);

  //   // Set the response headers to display the PDF in the browser
  //   res.setHeader("Content-Type", "application/pdf");
  //   res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

  //   // Pipe the PDF document to the response stream
  //   doc.pipe(res);

  //   // End the document
  //   doc.end();

  //   // Open the PDF document in a new browser tab
  //   const file = path.join(directoryPath, fileName);
  //   const fileData = fs.readFileSync(file);
  //   const base64Data = fileData.toString("base64");
  //   const pdfUrl = "data:application/pdf;base64," + base64Data;
  //   const script = `window.open('${pdfUrl}');`;
  //   res.write(
  //     `<html><head><script>${script}</script></head><body></body></html>`
  //   );
  //   res.end();
  // },
  invoice: async (req, res) => {
    try {
      const transactionId = req.params.id;
      const trans = await Transaction.findById(transactionId)
        .populate("userId")
        .populate("category")
        .populate({
          path: "spareparts.sparepartId",
          select: "name price",
        })
        .populate("cars")
        .exec();

      console.log(
        "trans-->",
        trans.spareparts.map((res) => {
          return res.sparepartId;
        })
      );
      res.render("admin/invoice/invoice", { transaction: trans });
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  },
};

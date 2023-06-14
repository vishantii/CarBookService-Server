const Transaction = require("./model");
const Slot = require("../dateslot/model");
const moment = require("moment-timezone");
const Sparepart = require("../sparepart/model");

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

      const bookingNumber = req.query.bookingNumber;
      const date = req.query.date;
      const viewAll = req.query.viewAll;

      if (date) {
        transactionQuery = transactionQuery.where({ chooseDate: date });
      }

      if (bookingNumber) {
        transactionQuery = transactionQuery.where({
          bookingNumber: bookingNumber,
        });
      }

      if (viewAll === "" || viewAll === null) {
        // Retrieve all transactions without filtering by date
        transactionQuery = Transaction.find({
          "category.name": "Servis Ringan",
        }).populate("userId");
      }

      if (viewAll === "" || viewAll === null) {
        const transaction = await transactionQuery
          .populate({
            path: "spareparts.sparepartId",
            select: "name price",
          })
          .sort({ chooseDate: 1 })
          .exec();
        res.render("admin/transaction/view_transaction", {
          transaction,
          alert,
          name: req.session.user.name,
          title: "Halaman Transaksi",
        });
      }

      const transaction = await transactionQuery
        .populate({
          path: "spareparts.sparepartId",
          select: "name price",
        })
        .sort({ queueNumber: 1 })
        .exec();
      res.render("admin/transaction/view_transaction", {
        transaction,
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

  viewEdit: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({ _id: id }).populate(
        "spareparts.sparepartId"
      );

      const spareparts = await Sparepart.find();

      console.log("transactions-->", transaction);

      res.render("admin/transaction/edit", {
        transaction,
        spareparts,
        name: req.session.user.name,
        title: "Halaman ubah Transaksi",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction");
    }
  },

  addSparepart: async (req, res) => {
    try {
      const { id } = req.params;
      const { sparepartId, quantity } = req.body;

      // Cari transaksi
      const transaction = await Transaction.findOne({ _id: id });

      // Cari sparepart
      const sparepart = await Sparepart.findOne({ _id: sparepartId });

      // Tambahkan sparepart ke transaksi dengan quantity
      transaction.spareparts.push({ sparepartId: sparepart._id, quantity });

      // Tambahkan harga sparepart ke total berdasarkan quantity
      transaction.total += sparepart.price * quantity;

      // Simpan perubahan pada transaksi
      await transaction.save();

      res.status(200).send({ success: true });
    } catch (err) {
      res.status(500).send({ success: false, message: err.message });
    }
  },

  actionEdit: async (req, res) => {
    try {
      await Transaction.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            "category.price": req.body["category.price"],
            spareparts: req.body.spareparts,
          },
        },
        { new: true }
      );
      res.redirect("/transaction");
    } catch (err) {
      console.error(err);
      res.redirect("/transaction");
    }
  },
  deleteSparepart: async (req, res) => {
    try {
      const { transactionId, sparepartId } = req.params;

      const transaction = await Transaction.findById(transactionId).populate(
        "spareparts.sparepartId"
      );
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }

      const sparepart = transaction.spareparts.find(
        (sparepart) => sparepart._id.toString() === sparepartId
      );

      if (!sparepart) {
        return res.status(404).send("Sparepart not found");
      }

      const index = transaction.spareparts.indexOf(sparepart);
      transaction.spareparts.splice(index, 1);

      console.log("index-->", index);

      console.log("DATA-->", sparepart);

      // Update total
      const sparepartTotal =
        parseInt(sparepart.quantity) * parseInt(sparepart.sparepartId.price);
      transaction.total = parseInt(transaction.total) - sparepartTotal;

      console.log("quantitiy-->", sparepart.quantity);
      console.log("price-->", sparepart.sparepartId.price);
      console.log("total-->", transaction.total);

      console.log("sparepartTotal-->", sparepartTotal);

      await transaction.save();

      res.redirect(`/transaction/edit/${transactionId}`);
    } catch (err) {
      console.log("err-->", err);
      res.status(500).send("Internal server error");
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const { categoryPrice, notes } = req.body;
      const { transactionId } = req.params;

      console.log("price-->", categoryPrice);

      // Mengambil transaksi berdasarkan ID
      const transaction = await Transaction.findById(transactionId).populate(
        "spareparts.sparepartId"
      );

      if (!transaction) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan" });
      }

      // Mengubah harga kategori servis
      transaction.category.price = categoryPrice;

      // Menghitung ulang total transaksi
      let total = transaction.category.price;

      // Mengupdate harga total transaksi jika ada sparepart
      if (transaction.spareparts.length > 0) {
        const sparepartPrices = transaction.spareparts.map((sparepart) => {
          console.log("sparePrice-->", sparepart);
          return (
            parseInt(sparepart.sparepartId.price) * parseInt(sparepart.quantity)
          );
        });
        console.log("parts-->", sparepartPrices);
        const sparepartsTotal = sparepartPrices.reduce(
          (acc, curr) => acc + curr,
          0
        );
        console.log("final-->", sparepartsTotal);
        total += sparepartsTotal;
      }

      transaction.total = total;
      transaction.notes = notes;

      // Menyimpan perubahan transaksi
      await transaction.save();

      req.flash("alertMessage", `Berhasil ubah transaksi`);
      req.flash("alertStatus", "success");
      res.redirect(`/transaction`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan server" });
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
      const bookingNumber = req.query.bookingNumber;
      const viewAll = req.query.viewAll;

      if (date) {
        transactionQuery = transactionQuery.where({ chooseDate: date });
      }

      if (bookingNumber) {
        transactionQuery = Transaction.find({
          bookingNumber: bookingNumber,
          "category.name": "Servis Berat",
        }).populate("userId");
      }

      if (viewAll === "" || viewAll === null) {
        // Retrieve all transactions without filtering by date
        transactionQuery = Transaction.find({
          "category.name": "Servis Berat",
        }).populate("userId");

        const transaction = await transactionQuery
          .populate({
            path: "spareparts.sparepartId",
            select: "name price",
          })
          .sort({ chooseDate: 1 })
          .exec();

        res.render("admin/secondtransaction/view_transaction", {
          transaction,
          alert,
          name: req.session.user.name,
          title: "Halaman Transaksi",
        });
      }

      const transaction = await transactionQuery
        .populate({
          path: "spareparts.sparepartId",
          select: "name price",
        })
        .sort({ queueNumber: 1 })
        .exec();

      res.render("admin/secondtransaction/view_transaction", {
        transaction,
        alert,
        name: req.session.user.name,
        title: "Halaman Transaksi",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/transaction/second");
    }
  },
  actionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.query;
      const currentDate = moment.tz("Asia/Jakarta").format("YYYY-MM-DD");

      const transaction = await Transaction.findById(id);
      const category = transaction.category;

      if (
        transaction.chooseDate !== currentDate &&
        category.name === "Servis Ringan"
      ) {
        req.flash(
          "alertMessage",
          "Tidak dapat mengubah status transaksi. Transaksi hanya dapat diubah pada tanggal yang sama dengan tanggal saat ini."
        );
        req.flash("alertStatus", "danger");
        if (category.name === "Servis Ringan") {
          return res.redirect("/transaction");
        } else {
          return res.redirect("/transaction/second");
        }
      }

      if (status === "1") {
        // Check if there are any earlier transactions on the same date with lower queue numbers and status not equal to 3 or 4
        if (category.name === "Servis Berat") {
          // Check if there are any unfinished transactions on the same date or previous dates
          const unfinishedTransactions = await Transaction.find({
            category: category,
            status: { $in: [0, 1, 2] },
            $or: [
              { chooseDate: { $lt: transaction.chooseDate } },
              {
                chooseDate: transaction.chooseDate,
                queueNumber: { $lt: transaction.queueNumber },
              },
            ],
          });

          if (unfinishedTransactions.length > 0) {
            req.flash(
              "alertMessage",
              "Tidak dapat mengubah status transaksi saat ini. Harap selesaikan transaksi pada tanggal dan nomor antrian sebelumnya terlebih dahulu."
            );
            req.flash("alertStatus", "danger");
            if (category.name === "Servis Ringan") {
              return res.redirect("/transaction");
            } else {
              return res.redirect("/transaction/second");
            }
          }
        }
        const earlierTransactions = await Transaction.find({
          chooseDate: transaction.chooseDate,
          category: transaction.category,
          queueNumber: { $lt: transaction.queueNumber },
          status: { $nin: [3, 4] },
        }).sort({ queueNumber: 1 });

        if (earlierTransactions.length > 0) {
          req.flash(
            "alertMessage",
            "Tidak dapat mengubah status transaksi saat ini. Harap selesaikan transaksi dengan nomor antrian yang lebih rendah terlebih dahulu."
          );
          req.flash("alertStatus", "danger");
          if (category.name === "Servis Ringan") {
            return res.redirect("/transaction");
          } else {
            return res.redirect("/transaction/second");
          }
        }
      }

      if (status === "3" || status === "4") {
        // Check if there are any earlier transactions on the same date with lower queue numbers and status not equal to 3 or 4
        if (category.name === "Servis Berat") {
          // Check if there are any unfinished transactions on the same date or previous dates
          const unfinishedTransactions = await Transaction.find({
            category: category,
            status: { $in: [0, 1, 2] },
            $or: [
              { chooseDate: { $lt: transaction.chooseDate } },
              {
                chooseDate: transaction.chooseDate,
                queueNumber: { $lt: transaction.queueNumber },
              },
            ],
          });

          if (unfinishedTransactions.length > 0) {
            req.flash(
              "alertMessage",
              "Tidak dapat mengubah status transaksi saat ini. Harap selesaikan transaksi pada tanggal dan nomor antrian sebelumnya terlebih dahulu."
            );
            req.flash("alertStatus", "danger");
            if (category.name === "Servis Ringan") {
              return res.redirect("/transaction");
            } else {
              return res.redirect("/transaction/second");
            }
          }
        }
        // Check if there are any pending transactions with lower queue numbers on the same date and category
        const pendingTransactions = await Transaction.find({
          chooseDate: transaction.chooseDate,
          category: category,
          queueNumber: { $lt: transaction.queueNumber },
          status: { $nin: [3, 4] },
        });

        if (pendingTransactions.length > 0) {
          req.flash(
            "alertMessage",
            "Transaksi saat ini telah diselesaikan. Harap selesaikan transaksi dengan nomor antrian yang lebih rendah terlebih dahulu."
          );
          req.flash("alertStatus", "danger");
          if (category.name === "Servis Ringan") {
            return res.redirect("/transaction");
          } else {
            return res.redirect("/transaction/second");
          }
        }
      }

      if (category.name === "Servis Ringan") {
        await Slot.updateOne(
          { date: transaction.chooseDate },
          { $inc: { reservedSlotsLight: -1 } },
          { upsert: true }
        );
      } else if (category.name === "Servis Berat") {
        await Slot.updateOne(
          { date: transaction.chooseDate },
          { $inc: { reservedSlotsHeavy: -1 } },
          { upsert: true }
        );
      }

      await Transaction.findByIdAndUpdate({ _id: id }, { status });

      req.flash("alertMessage", "Berhasil ubah status");
      req.flash("alertStatus", "success");
      if (category.name === "Servis Ringan") {
        return res.redirect("/transaction");
      } else {
        return res.redirect("/transaction/second");
      }
    } catch (err) {
      const transaction = await Transaction.findById(id);
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      if (transaction.category.name === "Servis Ringan") {
        return res.redirect("/transaction");
      } else {
        return res.redirect("/transaction/second");
      }
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

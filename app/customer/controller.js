const Transaction = require("../transaction/model");
const Schedule = require("../schedule/model");
const Category = require("../category/model");
const Sparepart = require("../sparepart/model");
const Carmake = require("../carmake/model");
const config = require("../../config");
const Customer = require("./model");
const Slot = require("../dateslot/model");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

module.exports = {
  index: async (req, res) => {
    try {
      const alertMessage = req.flash("alertMessage");
      const alertStatus = req.flash("alertStatus");

      const alert = { message: alertMessage, status: alertStatus };
      const customer = await Customer.find();

      res.render("admin/customer/view_customer", {
        customer,
        alert,
        name: req.session.user.name,
        title: "Halaman customer",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/customer");
    }
  },
  viewEdit: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await Customer.findOne({ _id: id });

      res.render("admin/customer/edit", {
        customer,
        name: req.session.user.name,
        title: "Halaman ubah customer",
      });
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/customer");
    }
  },

  actionEdit: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      await Customer.findOneAndUpdate(
        {
          _id: id,
        },
        { name, email }
      );

      req.flash("alertMessage", "Berhasil ubah customer");
      req.flash("alertStatus", "success");

      res.redirect("/customer");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/customer");
    }
  },

  actionDelete: async (req, res) => {
    try {
      const { id } = req.params;

      // Step 1: Check if user has any transactions with status 3
      const transaction = await Transaction.findOne({
        userId: id,
        status: 3,
      });

      if (transaction) {
        await Transaction.findByIdAndDelete(transaction._id);
        req.flash("alertMessage", "Berhasil hapus kategori");
        req.flash("alertStatus", "success");
        return res.redirect("/customer");
      }

      // Step 2: Find user and their transactions
      const user = await Customer.findById(id);
      const transactions = await Transaction.find({ userId: id });

      // Step 3: Reset spare part stock and time availability for each transaction
      for (const transaction of transactions) {
        if (transaction.status !== 3) {
          for (const sparepart of transaction.spareparts) {
            const originalSparepart = await Sparepart.findById(
              sparepart.sparepartId
            );
            originalSparepart.stock += sparepart.quantity;
            await originalSparepart.save();
          }
          const schedule = await Schedule.findOne({
            date: transaction.chooseDate,
          });
          const selectedTime = schedule.times.find(
            (time) => time.time === transaction.chooseTime
          );
          selectedTime.available = true;
          await schedule.save();
        }
      }

      // Step 4: Delete transactions
      await Transaction.deleteMany({ userId: id });

      // Step 5: Delete user
      await Customer.findByIdAndDelete(id);

      req.flash("alertMessage", "Berhasil hapus kategori");
      req.flash("alertStatus", "success");
      res.redirect("/customer");
    } catch (err) {
      req.flash("alertMessage", `${err.message}`);
      req.flash("alertStatus", "danger");
      res.redirect("/customer");
    }
  },

  category: async (req, res) => {
    try {
      const category = await Category.find();

      res.status(200).json({ data: category });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },
  spareparts: async (req, res) => {
    try {
      const sparepart = await Sparepart.find();

      res.status(200).json({ data: sparepart });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },
  carmake: async (req, res) => {
    try {
      const cars = await Carmake.find();
      return res.json({ data: cars });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  categoryById: async (req, res) => {
    const { id } = req.body;
    try {
      const category = await Category.find({ _id: id });

      res.status(200).json({ data: category });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },
  carById: async (req, res) => {
    const { id } = req.body;
    try {
      const cars = await Carmake.find({ _id: id });

      res.status(200).json({ data: cars });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },
  cancelTransaction: async (req, res) => {
    const { id } = req.body;
    try {
      const transaction = await Transaction.findByIdAndDelete({ _id: id });

      res.status(200).json({ data: transaction });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  updateTimeAvailability: async (req, res) => {
    try {
      const date = new Date(req.body.date);
      const time = req.body.time;

      Schedule.findOneAndUpdate(
        { date: date, "times.time": time },
        { $set: { "times.$.available": false } }
      )
        .then((result) => {
          if (result.nModified === 0) {
            res.sendStatus(404);
          } else {
            res.sendStatus(200);
          }
        })
        .catch((error) => {
          console.error(error);
          res.sendStatus(500);
        });
    } catch (error) {
      res.status(500);
    }
  },

  queueStatus: async (req, res) => {
    try {
      const { chooseDate, category } = req.body;

      let reservedSlots = 0;
      let totalSlots = 0;

      let slot = await Slot.findOne({ date: chooseDate }).exec();
      if (!slot) {
        // If slot for the chosen date does not exist, create a new slot with default values
        slot = new Slot({
          date: chooseDate,
          totalSlotsLight: 10,
          totalSlotsHeavy: 12,
          reservedSlotsLight: 0,
          reservedSlotsHeavy: 0,
        });
        await slot.save();
      }

      // Get the total slots and reserved slots for the chosen category
      if (category.name === "Servis Ringan") {
        totalSlots = slot.totalSlotsLight;
        reservedSlots = slot.reservedSlotsLight;
      } else if (category.name === "Servis Berat") {
        totalSlots = slot.totalSlotsHeavy;
        reservedSlots = slot.reservedSlotsHeavy;
      } else {
        return res.status(400).json({ message: "Invalid category" });
      }

      res.status(200).json({
        data: reservedSlots,
        totalSlots: totalSlots,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  checkout: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        cars,
        miles,
        licensePlate,
        chooseDate,
        notes,
        category,
        spareparts,
        total,
      } = req.body;

      const slot = await Slot.findOne({ date: chooseDate }, null, { session });

      const chosenCategory = await Category.findById(category.id).session(
        session
      );
      if (!chosenCategory) {
        return res.status(400).json({ message: "Invalid category" });
      }

      let reservedSlots;
      let totalSlots;
      if (chosenCategory.name === "Servis Ringan") {
        reservedSlots = "reservedSlotsLight";
        totalSlots = "totalSlotsLight";
      } else if (chosenCategory.name === "Servis Berat") {
        reservedSlots = "reservedSlotsHeavy";
        totalSlots = "totalSlotsHeavy";
      } else {
        return res.status(400).json({ message: "Invalid category" });
      }

      if (!slot || slot[reservedSlots] >= slot[totalSlots]) {
        return res.status(400).json({ message: "Booking slot is full" });
      }

      const timestamp = Date.now();
      const jakartaTime = moment(timestamp)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const randomNum = Math.floor(Math.random() * 1000000) + 1;
      const bookingNum = timestamp + randomNum;

      const payload = {
        cars: cars,
        category: category,
        miles: miles,
        licensePlate: licensePlate,
        chooseDate: chooseDate,
        notes: notes,
        userId: req.customer._id,
        bookingNumber: bookingNum,
        total: total,
        timestamp: jakartaTime,
        spareparts: spareparts.map((sparepart) => ({
          sparepartId: mongoose.Types.ObjectId(sparepart.sparepartId),
          quantity: sparepart.quantity,
        })),
      };

      const transactions = await Transaction.find(
        {
          chooseDate: chooseDate,
          "category.id": category.id,
        },
        null,
        { session }
      )
        .sort({ timestamp: 1 })
        .session(session);

      payload.queueNumber = transactions.length + 1;

      const transaction = new Transaction(payload);

      for (const sparepart of spareparts) {
        if (sparepart && sparepart.sparepartId && sparepart.quantity) {
          const foundSparepart = await Sparepart.findById(
            sparepart.sparepartId
          ).session(session);
          if (!foundSparepart) {
            throw new Error(
              `Sparepart with id ${sparepart.sparepartId} not found`
            );
          }
          foundSparepart.stock -= sparepart.quantity;
          await foundSparepart.save();
        }
      }

      slot[reservedSlots] += 1;
      await slot.save();

      await transaction.save({ session });
      await session.commitTransaction();

      res.status(200).json({
        data: transaction,
      });
    } catch (err) {
      await session.abortTransaction();
      res.status(500).json({ message: err.message || `Internal server error` });
    } finally {
      session.endSession();
    }
  },

  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { newDate } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      // Temukan transaksi yang ingin diubah
      const transaction = await Transaction.findById(id);

      // Pastikan transaksi ditemukan dan memiliki status 0 (belum selesai)
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }
      if (transaction.status !== 0) {
        return res.status(400).json({
          message: "Transaksi tidak dapat diubah karena sudah selesai",
        });
      }
      // Cek apakah slot sudah ada, jika belum generate slot baru
      let slot = await Slot.findOne({ date: newDate });
      if (!slot) {
        const maxSlot = 15;
        slot = new Slot({
          date: newDate,
          reservedSlotsLight: 0, // reservedSlotsLight untuk kategori servis ringan
          reservedSlotsHeavy: 0, // reservedSlotsHeavy untuk kategori servis berat
          availableSlots: maxSlot,
        });
        await slot.save();
      }

      // Menghitung jumlah transaksi dengan tanggal servis baru
      const countTransaction = await Transaction.countDocuments({
        chooseDate: newDate,
        status: { $ne: 4 }, // status 3 berarti transaksi dibatalkan
      });

      // Memastikan tidak ada lebih dari 15 transaksi pada tanggal yang dipilih
      if (countTransaction >= 15) {
        return res.status(400).json({
          message: "Jumlah antrian pada tanggal tersebut sudah penuh",
        });
      }

      // Memperbarui transaksi dengan tanggal servis baru
      const oldDate = transaction.chooseDate;
      const category = transaction.category;
      transaction.chooseDate = newDate;
      await transaction.save();

      // Memperbarui slot di tanggal lama dan tanggal baru
      const oldSlot = await Slot.findOne({ date: oldDate });
      if (category.name === "Servis Ringan") {
        oldSlot.reservedSlotsLight -= 1;
      } else if (category.name === "Servis Berat") {
        oldSlot.reservedSlotsHeavy -= 1;
      }
      oldSlot.availableSlots += 1;
      await oldSlot.save();

      if (category.name === "Servis Ringan") {
        slot.reservedSlotsLight += 1;
      } else if (category.name === "Servis Berat") {
        slot.reservedSlotsHeavy += 1;
      }
      slot.availableSlots -= 1;
      await slot.save();

      // update queueNumber transaksinya
      const queueNumber =
        (await Transaction.countDocuments({
          chooseDate: newDate,
          category: category,
          status: { $ne: 4 },
          createdAt: { $lt: transaction.createdAt },
        })) + 1;
      transaction.queueNumber = queueNumber;
      await transaction.save();

      res.status(200).json({
        message: "Jadwal servis berhasil diubah",
        oldDate: oldDate,
        oldDateSlot: oldSlot.availableSlots,
        newDate: newDate,
        newDateSlot: slot.availableSlots,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  },

  history: async (req, res) => {
    try {
      let criteria = {};

      if (req.customer._id) {
        criteria = {
          ...criteria,
          userId: req.customer._id,
        };
      }

      const history = await Transaction.find(criteria);

      res.status(200).json({
        data: history,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  historyDetail: async (req, res) => {
    try {
      const { id } = req.params;

      const history = await Transaction.findOne({ _id: id })
        .populate("spareparts.sparepartId")
        .populate("userId");

      if (!history)
        return res.status(404).json({ message: "history tidak ditemukan." });

      res.status(200).json({ data: history });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  updateStatusTransaction: async (req, res) => {
    const transactionId = req.params.id;
    const newStatus = req.body.status;

    Transaction.findById(transactionId)
      .then(async (transaction) => {
        if (!transaction) {
          res.status(404).send({ message: "Transaction not found" });
        } else {
          transaction.status = newStatus;
          const chooseDate = transaction.chooseDate;
          const chooseCategory = transaction.category;
          let slot = await Slot.findOne({ date: chooseDate }).exec();

          if (newStatus === 4) {
            // Cancel transaction
            if (chooseCategory.name === "Servis Ringan") {
              slot.reservedSlotsLight -= 1;
            } else if (chooseCategory === "Servis Berat") {
              slot.reservedSlotsHeavy -= 1;
            }
          }
          // } else {
          //   // Update transaction status to other than cancelled
          //   if (chooseCategory.name === "Servis Ringan") {
          //     slot.reservedSlotsLight += 1;
          //   } else if (chooseCategory === "Servis Berat") {
          //     slot.reservedSlotsHeavy += 1;
          //   }
          // }

          await slot.save();
          await transaction.save();

          console.log(
            `Updated status of transaction with ID ${transaction._id}`
          );
          res.send(transaction);
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      });
  },

  profile: async (req, res) => {
    try {
      const customer = {
        id: req.customer._id,
        username: req.customer.username,
        email: req.customer.email,
        name: req.customer.name,
        avatar: req.customer.avatar,
        phone_number: req.customer.phoneNumber,
      };

      res.status(200).json({ data: customer });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  editProfile: async (req, res, next) => {
    try {
      const { name = "", phoneNumber = "" } = req.body;

      const payload = {};

      if (name.length) payload.name = name;
      if (phoneNumber.length) payload.phoneNumber = phoneNumber;

      if (req.file) {
        let tmp_path = req.file.path;
        let originalExt =
          req.file.originalname.split(".")[
            req.file.originalname.split(".").length - 1
          ];
        let filename = req.file.filename + "." + originalExt;
        let targetPath = path.resolve(
          config.rootPath,
          `public/uploads/${filename}`
        );
        const src = fs.createReadStream(tmp_path);
        const dest = fs.createWriteStream(targetPath);
        src.pipe(dest);
        src.on("end", async () => {
          let customer = await Customer.findOne({ _id: req.customer._id });
          let currImage = `${config.rootPath}/public/uploads/${customer.avatar}`;
          if (fs.existsSync(currImage)) {
            fs.unlinkSync(currImage);
          }

          await Customer.findOneAndUpdate(
            {
              _id: req.customer._id,
            },
            { ...payload, avatar: filename },
            { new: true, runValidators: true }
          );

          res.status(200).json({
            data: {
              id: customer.id,
              name: customer.name,
              phoneNumber: customer.phoneNumber,
              avatar: customer.avatar,
            },
          });
        });
        src.on("err", async () => {
          next(err);
        });
      } else {
        const customer = await Customer.findOneAndUpdate(
          {
            _id: req.customer._id,
          },
          payload,
          { new: true, runValidators: true }
        );
        res.status(201).json({
          data: {
            id: customer.id,
            name: customer.name,
            phoneNumber: customer.phoneNumber,
            avatar: customer.avatar,
          },
        });
      }
    } catch (err) {
      if (err && err.name === "ValidationError") {
        res.status(422).json({
          error: 1,
          message: err.message,
          fields: err.errors,
        });
      }
    }
  },
};

const Transaction = require("../transaction/model");
const Schedule = require("../schedule/model");
const Category = require("../category/model");
const Sparepart = require("../sparepart/model");
const Carmake = require("../carmake/model");
const config = require("../../config");
const Customer = require("./model");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { createInvoice } = require("../../Utils/Invoice/createInvoice");

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

      await Customer.findOneAndRemove({
        _id: id,
      });

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
          console.log(`Updated ${result.nModified} documents`);
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

  checkout: async (req, res) => {
    try {
      const {
        cars,
        miles,
        licensePlate,
        chooseDate,
        chooseTime,
        notes,
        category,
        spareparts,
        total,
      } = req.body;
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000) + 1;
      const bookingNum = timestamp + randomNum;

      // Update the payload to include an array of objects for each sparepart
      const payload = {
        cars: cars,
        category: category,
        miles: miles,
        licensePlate: licensePlate,
        chooseDate: chooseDate,
        chooseTime: chooseTime,
        notes: notes,
        userId: req.customer._id,
        bookingNumber: bookingNum,
        total: total,
        spareparts: spareparts.map((sparepart) => ({
          sparepartId: mongoose.Types.ObjectId(sparepart.sparepartId),
          quantity: sparepart.quantity,
        })),
      };

      const transaction = new Transaction(payload);

      // Update the quantity of each sparepart in the database
      for (const sparepart of spareparts) {
        if (sparepart && sparepart.sparepartId && sparepart.quantity) {
          // Check if sparepart object is defined and has sparepartId and quantity properties
          const foundSparepart = await Sparepart.findById(
            sparepart.sparepartId
          );
          if (!foundSparepart) {
            throw new Error(
              `Sparepart with id ${sparepart.sparepartId} not found`
            );
          }
          foundSparepart.stock -= sparepart.quantity;
          await foundSparepart.save();
        }
      }

      await transaction.save();

      res.status(200).json({
        data: transaction,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
    }
  },

  updateSchedule: async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;

    try {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const availability = await Schedule.findOne({ date });
      if (!availability) {
        return res.status(404).json({ message: "Availability not found" });
      }

      const timeSlot = availability.times.find((t) => t.time === time);
      if (!timeSlot || !timeSlot.available) {
        return res.status(400).json({ message: "Time slot not available" });
      }

      const oldTimeSlot = availability.times.find(
        (t) => t.time === transaction.chooseTime
      );
      if (oldTimeSlot) {
        oldTimeSlot.available = true;
        await availability.save();
      }

      timeSlot.available = false;
      await availability.save();

      transaction.chooseDate = date;
      transaction.chooseTime = time;
      await transaction.save();

      res.json({ message: "Date and time updated successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
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
      .then((transaction) => {
        if (!transaction) {
          res.status(404).send({ message: "Transaction not found" });
        } else {
          transaction.status = newStatus;
          transaction
            .save()
            .then((result) => {
              console.log(
                `Updated status of transaction with ID ${result._id}`
              );

              if (newStatus === 4) {
                Schedule.findOne({ date: new Date(transaction.chooseDate) })
                  .then((schedule) => {
                    const time = schedule.times.find(
                      (t) => t.time === transaction.chooseTime
                    );
                    time.available = true;
                    schedule
                      .save()
                      .then(() => {
                        console.log(
                          `Updated availability for ${transaction.chooseDate} ${transaction.chooseTime}`
                        );
                        res.send(result);
                      })
                      .catch((error) => {
                        console.error(error);
                        res.status(500);
                      });
                  })
                  .catch((error) => {
                    console.error(error);
                    res.status(500);
                  });
              } else {
                res.send(result);
              }
            })
            .catch((error) => {
              console.error(error);
              res.sendStatus(500);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500);
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
        let originaExt =
          req.file.originalname.split(".")[
            req.file.originalname.split(".").length - 1
          ];
        let filename = req.file.filename + "." + originaExt;
        let target_path = path.resolve(
          config.rootPath,
          `public/uploads/${filename}`
        );

        const src = fs.createReadStream(tmp_path);
        const dest = fs.createWriteStream(target_path);

        src.pipe(dest);

        src.on("end", async () => {
          let customer = await Customer.findOne({ _id: req.customer._id });

          let currentImage = `${config.rootPath}/public/uploads/${customer.avatar}`;
          if (fs.existsSync(currentImage)) {
            fs.unlinkSync(currentImage);
          }

          customer = await Customer.findOneAndUpdate(
            {
              _id: req.customer._id,
            },
            {
              ...payload,
              avatar: filename,
            },
            { new: true, runValidators: true }
          );

          console.log(customer);

          res.status(201).json({
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
  invoice: async (req, res) => {
    // Get the transaction details from the request
    const transaction = req.body;

    // Generate a unique name for the invoice
    const date = new Date();
    const fileName = `invoice_${date.getTime()}.pdf`;
    const directoryPath = "Utils/Invoice/files";

    // Generate the invoice and get the file path
    const invoicePath = await createInvoice(
      transaction,
      directoryPath,
      fileName
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send the file to the client for download
    res.download(invoicePath, fileName, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error downloading file");
      }

      // Delete the file after it has been sent
      fs.unlinkSync(invoicePath);
    });
  },
};

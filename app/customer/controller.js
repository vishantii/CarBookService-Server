const Transaction = require("../transaction/model");
const Schedule = require("../schedule/model");
const Category = require("../category/model");
const config = require("../../config");
const Customer = require("./model");
const path = require("path");
const fs = require("fs");

module.exports = {
  category: async (req, res) => {
    try {
      const category = await Category.find();

      res.status(200).json({ data: category });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
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
        carBrand,
        carType,
        carYear,
        miles,
        licensePlate,
        chooseDate,
        chooseTime,
        notes,
        category,
      } = req.body;
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000) + 1;
      const bookingNum = timestamp + randomNum;

      const payload = {
        carBrand: carBrand,
        carType: carType,
        carYear: carYear,
        category: category,
        miles: miles,
        licensePlate: licensePlate,
        chooseDate: chooseDate,
        chooseTime: chooseTime,
        notes: notes,
        userId: req.customer._id,
        bookingNumber: bookingNum,
      };

      const transaction = new Transaction(payload);

      await transaction.save();

      res.status(200).json({
        data: transaction,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || `Internal server error` });
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

      const history = await Transaction.findOne({ _id: id });

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
              res.send(result);
            })
            .catch((error) => {
              console.error(error);
              res.status(500);
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
};

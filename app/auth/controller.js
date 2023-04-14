const Customer = require("../customer/model");
const path = require("path");
const fs = require("fs");
const config = require("../../config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  signup: async (req, res, next) => {
    try {
      const payload = req.body;

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
          try {
            const customer = new Customer({ ...payload, avatar: filename });

            await customer.save();

            delete customer._doc.password;

            res.status(201).json({ data: customer });
          } catch (err) {
            if (err && err.name === "ValidationError") {
              return res.status(422).json({
                error: 1,
                message: err.message,
                fields: err.errors,
              });
            }
            next(err);
          }
        });
      } else {
        let customer = new Customer(payload);

        await customer.save();

        delete customer._doc.password;

        res.status(201).json({ data: customer });
      }
    } catch (err) {
      if (err && err.name === "ValidationError") {
        return res.status(422).json({
          error: 1,
          message: err.message,
          fields: err.errors,
        });
      }
      next(err);
    }
  },

  signin: (req, res, next) => {
    const { email, password } = req.body;

    Customer.findOne({ email: email })
      .then((customer) => {
        if (customer) {
          const checkPassword = bcrypt.compareSync(password, customer.password);
          if (checkPassword) {
            const token = jwt.sign(
              {
                customer: {
                  id: customer.id,
                  username: customer.username,
                  email: customer.email,
                  nama: customer.nama,
                  phoneNumber: customer.phoneNumber,
                  avatar: customer.avatar,
                },
              },
              config.jwtKey
            );

            res.status(200).json({
              data: { token },
            });
          } else {
            res.status(403).json({
              message: "password yang anda masukan salah.",
            });
          }
        } else {
          res.status(403).json({
            message: "email yang anda masukan belum terdaftar.",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || `Internal server error`,
        });

        next();
      });
  },
};

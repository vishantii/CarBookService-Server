const Schedule = require("../schedule/model");

module.exports = {
  schedule: async (req, res) => {
    const generateTime = async (date) => {
      try {
        // Use Mongoose to find the availability data for the given date
        const availability = await Schedule.findOne({ date }).lean();

        // If availability data is found, return it
        if (availability) {
          // Loop through each time slot and set the available property to false if the time has passed
          availability.times.forEach((time) => {
            const timeDate = new Date(`${date.toDateString()} ${time.time}`);
            const currentTime = new Date();

            // Check if the time has passed for WIB timezone
            if (
              timeDate <
                new Date(
                  currentTime.toLocaleString("en-US", {
                    timeZone: "Asia/Jakarta",
                  })
                ) ||
              timeDate.getHours() ===
                new Date(
                  currentTime.toLocaleString("en-US", {
                    timeZone: "Asia/Jakarta",
                  })
                ).getHours()
            ) {
              time.available = false;
            }
          });

          // Update the availability data in the database
          await Schedule.updateOne({ date }, { times: availability.times });

          return availability.times;
        }

        // If no availability data is found, generate it dynamically
        const times = [
          { time: "09:00 AM", available: true },
          { time: "09:30 AM", available: true },
          { time: "10:00 AM", available: true },
          { time: "10:30 AM", available: true },
          { time: "11:00 AM", available: true },
          { time: "11:30 AM", available: true },
          { time: "01:00 PM", available: true },
          { time: "01:30 PM", available: true },
          { time: "02:00 PM", available: true },
          { time: "02:30 PM", available: true },
          { time: "03:00 PM", available: true },
          { time: "03:30 PM", available: true },
          { time: "04:00 PM", available: true },
          { time: "04:30 PM", available: true },
          { time: "05:00 PM", available: true },
        ];

        // Loop through each time slot and set the available property to false if the time has passed
        times.forEach((time) => {
          const timeDate = new Date(`${date.toDateString()} ${time.time}`);
          const currentTime = new Date();

          // Check if the time has passed for WIB timezone
          if (
            timeDate <
              new Date(
                currentTime.toLocaleString("en-US", {
                  timeZone: "Asia/Jakarta",
                })
              ) ||
            timeDate.getHours() ===
              new Date(
                currentTime.toLocaleString("en-US", {
                  timeZone: "Asia/Jakarta",
                })
              ).getHours()
          ) {
            time.available = false;
          }
        });

        // Save the dynamically generated availability data to the database
        await Schedule.create({ date, times });

        // Return the dynamically generated availability data
        return times;
      } catch (err) {
        console.error(err);
        return null;
      }
    };

    try {
      // Retrieve the date from the request body
      const date = new Date(req.body.date);

      // Generate availability for the given date
      const availability = await generateTime(date);

      // Return the availability as a response
      res.json({ data: availability });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
};

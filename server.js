const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint to create a booking
app.post("/api/bookings", async (req, res) => {
  const { name, contact, email, date_time, specific_issues, address } =
    req.body;

  const { data, error } = await supabase
    .from("bookings")
    .insert([{ name, contact, email, date_time, specific_issues, address }]);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
// Format the date here, after getting date_time from req.body
  const formattedDate = new Date(date_time).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  // Send email using Nodemailer
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email, // Recipient's email
      subject: "Booking Confirmation",
      text: `Booking confirmed for\n ${name}\nEmail Address:${email}\n on ${formattedDate}\n Issue: ${specific_issues}\n Address: ${address}`,
    });
  } catch (emailError) {
    console.error("Email Error:", emailError);
    return res.status(201).json({
      message: "Booking created, but email failed",
      data,
      emailError: emailError.message,
    });
  }

  res.status(201).json({ message: "Booking created and email sent", data });
});

/// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

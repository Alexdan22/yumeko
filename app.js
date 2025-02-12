//jshint esversion:6
require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const bodyParser = require("body-parser");
const app = express();



app.use(express.urlencoded({extended: true}));
app.use(express.json());



mongoose.set('strictQuery', false);
// mongoose.connect("mongodb://localhost:27017/mysteryDB");
mongoose.connect("mongodb+srv://alex-dan:Admin-12345@cluster0.wirm8.mongodb.net/mysteryDB");


const timeZone = 'Asia/Kolkata';
const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


let d = new Date();
let seconds = d.getSeconds();



const earningSchema = new mongoose.Schema({
    balance: Number,
    totalProfit: Number,
    totalReturn: Number,
    totalCommission: Number,
    profit: Number,
    returns: Number,
    commission: Number
  });
  const transactionSchema = new mongoose.Schema({
    type: String,
    from: String,
    amount: Number,
    status: String,
    time:{
      date: String,
      month: String,
      year: String
    },
    trnxId: String
  });
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
  
    email: {
      type: String,
      required: true
    },
  
    mobile: Number,
  
    userID: {
      type: String,
      required: true
    },
  
    password: {
      type: String,
      required: true
    },
  
    apiToken: String,
  
    sponsorID: String,
  
    earnings: earningSchema,
  
    transaction: [transactionSchema],
  
    status: String,
  
    promo: String,
  
    package: {
      validity: Number,
      status: String,
      time:{
        date:Number,
        month:Number,
        year: Number
      }
    },
  
    time: {
      date: String,
      month: String,
      year: String
    }
  
  });
  const adminSchema = new mongoose.Schema({
    email: String,
    payment:[
      {
        trnxId: String,
        email: String,
        amount: Number,
        username: String,
        time:{
          date: String,
          month: String,
          year: String,
          minutes: String,
          hour: String
        },
        status: String
      }
    ],
    withdrawal:[
      {
        trnxId: String,
        email: String,
        amount: Number,
        username: String,
        time:{
          date: String,
          month: String,
          year: String,
          minutes: String,
          hour: String
        },
      }
    ]
  });
  const paymentSchema = new mongoose.Schema({
    rrn: Number,
    email: String,
    amount: Number,
    upi: String,
    payment_id: { type: String, required: true, unique: true },
    username: String,
    time:{
      date: String,
      month: String,
      year: String,
      minutes: String,
      hour: String
    },
    status: String
  });
  const qrDataSchema = new mongoose.Schema({ text: String });
  
  
  
  const User = new mongoose.model("User", userSchema);
  
  const Admin = new mongoose.model("Admin", adminSchema);
  
  const Payment = new mongoose.model("Payment", paymentSchema);
  
  const Data = new mongoose.model('Data', qrDataSchema);


  //ROUTE

  app.get('/', function(req, res){
    console.log('Site is reachable and receiving alerts properlyS');
    
  })

  app.post("/payment/webhook", async (req, res) => {
        
    let year = currentTimeInTimeZone.year;
    let month = currentTimeInTimeZone.month;
    let date = currentTimeInTimeZone.day;
    let hour = currentTimeInTimeZone.hour;
    let minutes = currentTimeInTimeZone.minute;
    
    try {
        const payload = req.body;

        if (payload.event === "payment.captured") {
            const { id, amount, vpa, status } = payload.payload.payment.entity;
            const { email, contact } = payload.payload.payment.entity || {};
            const rrn = payload.payload.payment.entity.acquirer_data.rrn;

            // Check if payment already exists (avoid duplicates)
            const existingPayment = await Payment.findOne({ payment_id: id });
            if (existingPayment) {
                return res.status(200).json({ message: "Payment already recorded" });
            }

            // Save payment details to MongoDB
            const newPayment = new Payment({
                payment_id: id,
                amount: amount/100,
                status,
                upi: vpa,
                email,
                rrn,
                contact,
                time:{
                  date: date,
                  month: month,
                  year: year,
                  minutes: minutes,
                  hour: hour
                }
            });

            await newPayment.save();
            console.log("Payment Captured & Saved:", newPayment);

            return res.status(200).json({ success: true, message: "Payment recorded successfully" });
        }

        return res.status(400).json({ success: false, message: "Invalid event type" });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});





app.listen(process.env.PORT || 3001, function() {
  console.log("Server started on port 3001 | http://localhost:3001");
});

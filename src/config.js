const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/garagepro_db");

// Check if the database is connected
connect.then(() => {
    console.log("Database connected successfully!");
})
.catch(() => {
    console.log("Database connection failed");
});

// Create a schema for users/customers
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'customer' // Default role as customer
    }
});

// Create a schema for service bookings
const BookingSchema = new mongoose.Schema({
    // name: String,
    // address: String,
    // contact: String,
    // vehicleName: String,
    // vehicleNumber: String,
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        required: true
    },
    vehicleName: {
        type: String,
        required: true // Default role as customer
    },
    vehicleNumber: {
        type: String,
        required: true // Default role as customer
    }
});

// Create a schema for contact information
const ContactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bookedBy: [{ type: String }] // Array to hold names of users who booked the team
    // ... other fields ...
});

const Team = mongoose.model("Team", TeamSchema);

// Model for contacts collection
const Contact = new mongoose.model('Contact', ContactSchema);
// Model for users collection
const User = new mongoose.model('User', UserSchema);
// Model for bookings collection
const Booking = new mongoose.model('Booking', BookingSchema);

module.exports = { User, Booking, Contact, Team };
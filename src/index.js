const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const dotenv = require('dotenv'); // Import dotenv for environment variables
const { User, Booking, Contact, Team } = require("./config"); // Ensure this points to your User and Booking models

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static("public"));
app.use('/images', express.static('images'));


// Set up session management
app.use(session({
    secret: process.env.SESSION_SECRET, // Use the secret from the .env file
    resave: false,
    saveUninitialized: true
}));

// Render the login page
app.get("/", (req, res) => {
    res.render("login");
});

// Render the signup page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Route to handle contact form submission
app.post('/submit-contact', async (req, res) => {
    const { email, phone, message } = req.body;

    try {
        // Save contact details to the database
        const newContact = new Contact({ email, phone, message });
        await newContact.save();

        // Send a success message back to the client
        res.render('home', { message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Error saving contact:', err);
        res.render('home', { message: 'Failed to send the message, please try again.' });
    }
});



// Handle user login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ name: username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send("Invalid username or password.");
        }

        // Store user role in session
        req.session.user = {
            username: user.name,
            role: user.role
        };

        // Redirect based on user role
        if (user.role === "admin") {
            return res.redirect("/admin-dashboard"); // Redirect to admin dashboard
        } else {
            return res.redirect("/home"); // Redirect to home for other roles
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

// Handle user signup
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("Email already exists.");
        }

        // Validate password
        if (password.length > 20 || username === password) {
            return res.status(400).send("Invalid password.");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        let role = "user"; // Default role

        // Assign roles based on specific usernames/passwords
        if (username === "kamlesh" && password === "202200836") role = "admin";

        // Create new user
        const newUser = await User.create({ name: username, email, password: hashedPassword, role });
        console.log("User signed up successfully:", newUser);

        return res.status(201).send("User signed up successfully. Please log in.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

// Render the admin dashboard
app.get("/admin-dashboard", async (req, res) => {
    if (req.session.user && req.session.user.role === "admin") {
        try {
            const bookings = await Booking.find(); // Fetch all bookings
            const contacts = await Contact.find(); // Fetch all contact messages
            const teams = await Team.find(); // Assuming you have a Team model
            return res.render("admin-dashboard", { bookings, contacts, teams }); // Pass both to the template
        } catch (error) {
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }
    }
    return res.status(403).send("Access denied.");
});

// Route to delete a contact message
app.post('/delete-contact/:id', async (req, res) => {
    try {
        // Find the contact by ID and delete it
        await Contact.findByIdAndDelete(req.params.id);
        res.redirect('/admin-dashboard'); // Redirect back to the admin dashboard
    } catch (err) {
        console.error('Error deleting contact:', err);
        res.redirect('/admin-dashboard'); // Redirect even if there is an error
    }
});


app.post("/delete-booking/:id", async (req, res) => {
    try {
        const bookingId = req.params.id;
        await Booking.findByIdAndDelete(bookingId); // Deletes the booking from the database
        return res.redirect("/admin-dashboard"); // Redirects back to the admin dashboard
    } catch (error) {
        console.error(error);
        return res.status(500).send("Failed to delete the booking");
    }
});

// Render the home page
app.get("/home", (req, res) => {
    if (req.session.user) {
        return res.render("home"); // Ensure home.ejs exists
    }
    return res.redirect("/"); // Redirect to login if not authenticated
});

// Route to handle accessories page
app.get("/accessories", (req, res) => {
    if (req.session.user) {
        return res.render("accessories"); // Ensure accessories.ejs exists
    }
    return res.redirect("/"); // Redirect to login if not authenticated
});

// index.js

// Handle book now button to show service booking form
// Handle book now button to show service booking form
app.post("/book-service", async (req, res) => {
    const { name, address, contact, vehicleName, vehicleNumber } = req.body;

    try {
        // Ensure that all required fields are present
        if (!name || !address || !contact || !vehicleName || !vehicleNumber) {
            return res.status(400).send("All fields are required.");
        }

        // Save booking to the database
        const newBooking = await Booking.create({ name, address, contact, vehicleName, vehicleNumber });
        console.log("New booking created:", newBooking);
        
        // Redirect to a success page or send a success message
        res.status(201).send("Service booking submitted successfully.");
    } catch (error) {
        console.error("Failed to book service:", error.message);
        
        // Send an error message to the client
        res.status(500).send("Failed to book service.");
    }
});

// Route to render the teams page
app.get('/teams', (req, res) => {
    res.render('teams'); // This will render teams.ejs
});

app.get("/journey", (req, res) => {
    if (req.session.user) {
        return res.render("journey"); // Ensure accessories.ejs exists
    }
    return res.redirect("/"); // Redirect to login if not authenticated
});

app.post('/book-team', async (req, res) => {
    const { name, contact, vehicleName, vehicleNumber, address } = req.body;

    // Validate that all required fields are present
    if (!name || !contact || !vehicleName || !vehicleNumber || !address) {
        return res.status(400).send('All fields are required.');
    }

    // Create a new booking instance
    const booking = new Booking({
        name,
        contact,
        vehicleName,
        vehicleNumber,
        address
    });

    try {
        await booking.save();
        res.status(201).send('Booking successful!');
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).send('Error booking team.');
    }
});

// Handle hire now button to show hire form
app.post("/hire-team", (req, res) => {
    // Logic for handling team hire form can go here
    res.send("Team hired successfully");
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/home", async (req, res) => {
    let { username, password } = req.body;

    // Construct the query to be vulnerable to injection
    const user = await collection.findOne({
        $or: [
            { name: username },
            { password: password }
        ]
    });

    try {
        // Validate the password using bcrypt
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("User not signed in. Sign in to get started.");
        }
        
        // Check user role and render appropriate dashboard
        if (user.role === "admin") {
            const users = await collection.find({});
            return res.render("admin-dashboard", { users });
        } else if (user.role === "manager") {
            const users = await collection.find({ role: "user" });
            return res.render("manager-dashboard", { users });
        } else {
            return res.render("home");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if the username is special case "$ne": "admin"
        if (username === "$ne: admin") {
            // Prevent storing this special username in the database
            return res.status(400).send("Invalid username.");
        }

        // Check if the username already exists
        const existingUser = await collection.findOne({ name: username });
        if (existingUser) {
            return res.status(400).send("Username already exists.");
        }
        
        // Set role as "admin" for special username without password
        if (username === "$ne: admin" && !password) {
            let role = "admin";
            return res.status(201).send("User signed up successfully as admin.");
        }

        // For other signups, proceed with regular checks and hashing password
        if (password.length > 20) {
            return res.status(400).send("Password must not exceed 20 characters.");
        }

        if (username === password) {
            return res.status(400).send("Username and password cannot be the same.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let role = "user";
        const newUser = await collection.create({ name: username, password: hashedPassword, role });
        console.log("User signed up successfully:", newUser);
        
        res.status(201).send("User signed up successfully. Please log in.");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Update existing route for updating user roles
app.post("/updateRole/:userId", async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    try {
        await collection.findByIdAndUpdate(userId, { role });
        res.redirect("/admin-dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

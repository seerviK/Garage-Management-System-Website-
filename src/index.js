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

// Updated POST route for handling login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await collection.findOne({ name: username });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("Invalid username or password.");
        }
        // Redirect to home page upon successful login
        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/home", (req, res) => {
    res.render("home");
});

app.get("/viewDetails/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await collection.findById(userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Assuming user.passwords is an array of passwords
        user.passwords = [
            { website: "user.com", username: "xyz", password: "Xyz123456" },
            // Add more password objects as needed
        ];

        res.render("user_details", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/password_manage", async (req, res) => {
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
            return res.render("password_manage");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if the username already exists
        const existingUser = await collection.findOne({ name: username });
        if (existingUser) {
            return res.status(400).send("Username already exists.");
        }
        
        // Validate password length
        if (password.length > 20) {
            return res.status(400).send("Password must not exceed 20 characters.");
        }

        // Check if username and password are the same
        if (username === password) {
            return res.status(400).send("Username and password cannot be the same.");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        let role = "user"; // Default role is "user"
        // Set role as "admin" for specific username and password
        if (username === "kamlesh" && password === "202200836") {
            role = "admin";
        }
        // Set role as "manager" for specific username and password
        if (username === "manish" && password === "4518") {
            role = "manager";
        }

        // Create user with role as determined above
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

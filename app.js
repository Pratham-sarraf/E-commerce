const express = require("express");
const session = require('express-session'); 
const mongoose = require("mongoose");
const connectDB = require("./utils/db");
const MongoStore= require("connect-mongo");
const passport=require("passport");
const isLogin=require("./middleware/isLogin");
const isAdmin=require("./middleware/isAdmin");
const Product=require("./models/product.js");
const User=require("./models/user.js");
const contactUs=require("./models/contactUs.js");
const Review=require("./models/review.js");
const productsWithTags = require("./productTags");
const app = express();


const PORT = 3000;
app.set("view engine","ejs"); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false, // Changed to false for security
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
  },
  store: MongoStore.create({
    mongoUrl: "mongodb+srv://pratham_sarraf_22:1234@cluster0.4me9u.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0",
    collectionName: "sessions",
  })
}));


require("./utils/passport");

app.use(passport.initialize());  
app.use(passport.session());    



app.get("/", (req, res) => {
  res.render("home-page");
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect("/error");

    req.logIn(user, (err) => {
      if (err) return next(err);

      // ✅ Yahan check karo ki user admin hai ya nahi
      if (user.isAdmin) {
        return res.redirect("/admin");
      } else {
        return res.redirect("/products");
      }
    });
  })(req, res, next);
});


app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/error",(req,res)=>{
res.render("error", { errorMessage: "ERROR OCCOUR" });
})

app.get("/admin",isLogin,isAdmin,  (req, res) => {

    res.render("admin");

});

app.get('/logout', (req, res, next) => {
  
      res.clearCookie('connect.sid');
      
      res.redirect('/');

});










app.get("/dashboard",(req,res)=>{
    res.send("WELCOME TO DASHBOARD");
})



app.get("/register",(req,res)=>{
    res.render("register");
})

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/admin/add-product", isLogin,isAdmin,(req,res)=>{
        res.render("add-product");
})


app.post("/admin/add-product", async (req, res) => {
  const { name, price, url } = req.body;

  try {
    const newProduct = new Product({ name, price, url });
    await newProduct.save();
    res.status(201).json({ message: "Product saved successfully", product: newProduct });

  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



app.get('/products', async (req, res) => {
  try {
    const sortParam = req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    let sortQuery = {};

    if (sortParam === "price") {
      sortQuery = { price: 1 }; // Low to High
    } else if (sortParam === "name") {
      sortQuery = { name: 1 }; // A-Z
    }

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find({})
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.render("products", {
      products,
      user: req.user,
      currentPage: page,
      totalPages,
      sort: sortParam || ""
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Something went wrong");
  }
});




app.get("/products/all-products", async (req, res) => {
  try {
    if (!req.user?.products?.length) {
      return res.render("my-orders", { products: [], user: req.user });
    }

    // Count product occurrences first
    const productCounts = req.user.products.reduce((acc, productId) => {
      acc[productId] = (acc[productId] || 0) + 1;
      return acc;
    }, {});

    // Get unique product IDs
    const uniqueProductIds = Object.keys(productCounts).map(id => new mongoose.Types.ObjectId(id));

    // Fetch product details
    const products = await Product.find({
      _id: { $in: uniqueProductIds }
    });

    // Combine with counts
    const productsWithCounts = products.map(product => ({
      ...product.toObject(),
      count: productCounts[product._id.toString()]
    }));

    res.render("my-orders", { products: productsWithCounts, user: req.user });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Something went wrong");
  }
});



app.get('/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Step 1: Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Step 2: Manually fetch reviews based on product.reviews array
const reviews = await Review.find({ _id: { $in: product.reviews } }).populate('user');


    // Step 3: Render product + reviews
    const user=req.user;
    res.render('product-detail', { product, reviews });

  } catch (err) {
    console.error("Product detail error:", err);
    res.status(500).send("Server error");
  }
});



app.post("/products/:id/review", isLogin, async (req, res) => {
  try {
    const { review, rating } = req.body;
    const user = req.user; // Provided by Passport

    const newReview = await Review.create({
      review,
      rating,
      user: user._id,
    });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    product.reviews.push(newReview._id);
    await product.save();

    res.redirect(`/products/${req.params.id}`);
  } catch (err) {
    console.error("Error while posting review:", err);
    res.status(500).send("Something went wrong while submitting your review.");
  }
});







app.get("/admin/users", async (req, res) => {
  try {
    const allUsers = await User.find(); // ✅ model se data lo
    res.render('user-display', { users: allUsers }); // ✅ "users" pass karo EJS ko
  } catch (err) {
    console.error(err);
    res.send('Error loading users');
  }
});

app.post('/buy/:productId', isLogin, async (req, res) => {
  try {
    // 1. Get logged-in user
    const user = await User.findById(req.user._id);

    // 2. Increase order count
    user.orders += 1;

    // 3. Save user
    await user.save();

    // 4. Redirect to the actual product page
    res.redirect(`/products/${req.params.productId}`);
  } catch (err) {

    res.status(500).send("Something went wrong!");
  }
});

app.get('/user-profile', (req, res) => {
  res.render('user-profile', { user: req.user });
});


app.get("/admin/products",(req,res)=>{
    res.redirect("/products");
})



app.put("/update-profile", async (req, res) => {
  const { username, password } = req.body;

  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "User not found or unauthorized." });
    }

    await User.findByIdAndUpdate(userId, { username, password });
    
    // ✅ This is the main addition:
    res.json({ message: "Profile updated successfully!" });

  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Update failed: " + err.message });
  }
});



app.post("/delete-all-users", async (req, res) => {
  try {
    await User.deleteMany({});
    res.redirect("/admin/users"); // or wherever you want to go after deletion
  } catch (err) {
    console.error("Error deleting users:", err);
    res.status(500).send("Server error");
  }
});

app.get("/contact-user-page",(req,res)=>{
    res.render("contact-user-page");
})


app.post("/contact-user-page", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input if necessary (e.g., check for empty fields)
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const c = new contactUs({
      name,
      email,
      subject,
      message,
    });

    await c.save();

    // Send a JSON success response
    res.redirect("/contact-user-page")

  } catch (err) {
    console.error("Error saving contact message:", err);
    // Send a JSON error response
    res.status(500).json({ success: false, message: "Failed to send message. Please try again later." });
  }
});

app.post("/delete-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Optional: Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    await User.findByIdAndDelete(userId);
    res.redirect("/admin/users"); // ✅ Update this to the correct redirect page

  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/products/:id/add-to-cart", isLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    user.products.push(productId);
    await user.save();

    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/admin/user/:id/admin-user-display", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate("products");

    if (!user) return res.status(404).send("User not found");

    // Count product quantities
    const productQuantities = {};
    user.products.forEach(product => {
      const productId = product._id.toString();
      productQuantities[productId] = (productQuantities[productId] || 0) + 1;
    });

    // Get unique products with quantities
    const uniqueProducts = [];
    const seenProducts = new Set();
    
    user.products.forEach(product => {
      const productId = product._id.toString();
      if (!seenProducts.has(productId)) {
        seenProducts.add(productId);
        uniqueProducts.push({
          ...product.toObject(),
          quantity: productQuantities[productId]
        });
      }
    });

    res.render("admin-user-display", { 
      user,
      products: uniqueProducts 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// --- Your GET route for Admin Contact Submissions ---
app.get("/admin/contact-us", async (req, res) => {
  try {
    // Attempt to find all documents in the 'contact_us' collection,
    // and sort them by 'createdAt' in descending order (newest first).
    const contacts = await contactUs.find().sort({ createdAt: -1 });

    // If successful, render the EJS template and pass the fetched contacts array.
    res.render("admin-suggestion-display", { contacts });

  } catch (err) {
    // Log the full error for debugging on your server's console.
    console.error("Error fetching contact submissions for admin page:", err);

    // Send a user-friendly 500 Internal Server Error response.
    // In a production app, you might render a dedicated error page.
    res.status(500).send("An error occurred while fetching contact submissions. Please check server logs.");
  }
});

app.delete("/admin/contact-us/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await contactUs.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.send("done")
    
     
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});






app.delete("/products/delete/:productId", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).json({ message: "Product deleted successfully!" }); // ✅ MUST!
  } catch (err) {
    res.status(500).json({ error: "Error deleting product" }); // ✅ Error response
  }
});







connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Error:", err);
  });



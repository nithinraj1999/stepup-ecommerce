# 👟 StepUpNow – eCommerce Website for Shoes

ShoeStore is a modern eCommerce web application that allows users to browse, search, and purchase shoes online. The application follows the **MVC architecture** and includes separate modules for **users** and **admins**. Built using **Node.js**, **Express.js**, **MongoDB**, and **EJS**, it delivers a complete shopping and admin experience.

---

## 📸 Demo


> Example: https://shoecart.shop/

---

## 🛠️ Tech Stack

**Frontend:**
- HTML/CSS (pre-built responsive template)
- JavaScript (Vanilla JS)

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- EJS (Embedded JavaScript Templates)

**Architecture:**
- MVC (Model-View-Controller)

---

## 🔑 Features

### 👤 User Module
- User registration and authentication
- Product listing with search, filter, and sort
- Add to cart and wishlist
- Checkout and payment gateway integration
- Apply coupons and view offers
- Order tracking and order history
- Wallet and refund management

### 🛠️ Admin Module
- Admin authentication
- Dashboard with analytics and sales overview
- Product CRUD management
- Category management
- Offer and coupon creation & management
- User management (block/unblock, view activity)
- Order management
- Generate sales reports (daily/weekly/monthly)

---

## 🧑‍💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

```bash
git https://github.com/nithinraj1999/stepup-ecommerce.git
cd stepup-ecommerce
npm install
```

### Setup Environment Variables

Create a `.env` file in the root directory:

```


MAIL_HOST=your_mail_host
SMTP_PORT=smpt_port
MAIL_USER=email_to_send_from
MAIL_PASS=mail_password
KEY_ID =your_razorpay_key_id
KEY_SECRET= your_razorpay_key_secret
MONGODB_CONNECTION_STRING=your_mongodb_connection_stringappName=Cluster0
PORT=port_to_run_server
```

### Run the Application

```bash
npm start
```

App runs at: http://localhost:<your PORT from .env> (e.g., http://localhost:5000)

---

## 📁 Folder Structure

```
StepUpNow/
│
├── public/              # Static assets
├── views/               # EJS templates
├── models/              # Mongoose schemas
├── routes/              # Express route definitions
├── controllers/         # Business logic controllers
├── middlewares/         # Custom middleware (auth, error handling)
├── utils/               # Utility functions
├── config/              # Database & config files
├── .env                 # Environment variables
└── index.js             # Entry point
```

---

## 🔐 Authentication
- Users and Admins have separate login systems
- Sessions managed using `express-session`
- Passwords hashed using `bcrypt`

---

## 🚀 Deployment

Deployable to platforms like **Render**, **Vercel (backend API only)**, **Railway**, or **VPS**.

---

## 📦 Future Enhancements
- ✅ Email notifications (order confirmation, password reset)
- ✅ Product reviews and rating system
- ✅ Real-time order status updates
- ✅ SEO improvements
- ✅ Mobile app version (React Native or Flutter)

---





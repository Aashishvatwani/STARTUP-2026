# 📚 Assignment Solver Platform

### 🚀 Overview

**Assignment Solver** is a microservices-based web platform where users (buyers) can upload assignments, and solvers (freelancers) can accept and complete them for payment.
The system includes **AI, NLP, Blockchain, and Razorpay integration**, ensuring transparency, smart matching, and secure payment handling.

---

## 🏗️ Architecture

The app follows a **Microservices Architecture**, deployed via **Docker Compose**:

```
/assignment-solver
│
├── backend/
│   ├── main.go
│   ├── hash.go
│   ├── solver.go
│   ├── buyer.go
│   ├── nlp.go
│   ├── payment.go
│   ├── smartcontract/
│   │   ├── contract.sol
│   │   └── deploy.js
│   ├── database/
│   │   └── mongo.go
│   └── utils/
│       └── distance.go
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api/
│   └── package.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env
└── README.md
```

---

## ⚙️ Features

### 🧠 AI/NLP Integration

* Uses NLP to **analyze assignment descriptions** (through `/nlp-parse` route).
* Extracts important keywords like topic, urgency, complexity, subject, and deadline.
* Automatically matches solvers based on **skill similarity** and **location proximity**.

---

### 💰 Payment System (Razorpay + Smart Contract)

* Razorpay is integrated for **secure INR payments** (supports UPI, cards, wallets, net banking).
* **Smart Contract on Ethereum (via Pinata/MetaMask)** handles:

  * Buyer payment escrow.
  * 10% platform commission.
  * Release of payment to solver after successful delivery.
  * Automatic fine or delay penalty logic if missed deadlines.
* Buyer pays in advance → amount locked in contract → solver receives funds upon approval.

---

### 🧾 Smart Ranking System

* Buyers and Solvers both have ranking algorithms:

#### 🧑‍💻 For Solvers:

Top 10 solvers selected by:

1. Minimum bid price.
2. Maximum matching skills with assignment.
3. Shortest distance to buyer (using GeoJSON/Haversine formula).
4. Fastest delivery time.
5. High reliability score (based on previous tasks).

#### 👩‍🏫 For Buyers:

Top 10 buyers selected by:

1. Highest offered price.
2. Shortest deadline.
3. More detailed task description.
4. Frequent usage & good payment record.

---

### 💬 Chat & Bargaining

* Real-time chat (WebSocket or Firebase Realtime DB).
* Buyers and solvers can negotiate prices directly.
* Upon finalization, **new agreed price** updates backend data.
* Notifications and emails are triggered for:

  * New messages
  * Payment confirmation
  * Assignment completion
  * Urgency alerts

---

### 🔔 Notifications System

**For Solvers:**

* New assignment posted.
* Payment confirmation.
* Urgent tasks nearby.
* Chat message notifications.

**For Buyers:**

* Top solver found.
* Assignment accepted.
* Chat updates.
* Assignment delivery & completion status.

---

## 🧩 Tech Stack

| Component        | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Backend          | Go (Golang)                                            |
| Database         | MongoDB Atlas                                          |
| AI/NLP           | Go + HuggingFace API / OpenAI API                      |
| Payments         | Razorpay (India)                                       |
| Smart Contract   | Solidity (Ethereum)                                    |
| Blockchain API   | Pinata + MetaMask                                      |
| Frontend         | React (Vite or Next.js)                                |
| Containerization | Docker & Docker Compose                                |
| Hosting          | Vercel (Frontend), Amazon EC2 (Backend), MongoDB Cloud |

---

## 📦 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/ashishwatwani/assignment-solver.git
cd assignment-solver
```

### 2️⃣ Environment Variables

Create a `.env` file in the project root:

```bash
MONGO_URI=mongodb+srv://yourcluster.mongodb.net/
RAZORPAY_KEY_ID=rzp_test_XXXX
RAZORPAY_KEY_SECRET=YYYY
PINATA_API_KEY=ZZZZ
PINATA_SECRET=AAAA
OPENAI_API_KEY=sk-XXXX
```

### 3️⃣ Run via Docker

```bash
docker-compose up --build
```

This spins up:

* `backend`  Go server
* `frontend`  React UI
* `mongo`  MongoDB instance

---

## 🧠 API Endpoints

| Route                    | Method | Description                                  |
| ------------------------ | ------ | -------------------------------------------- |
| `/api/nlp-parse`         | POST   | Parse assignment details from text using NLP |
| `/api/buyers`            | GET    | Fetch top 10 buyers                          |
| `/api/solvers`           | GET    | Fetch top 10 solvers                         |
| `/api/payment/create`    | POST   | Create Razorpay order                        |
| `/api/payment/verify`    | POST   | Verify payment signature                     |
| `/api/chat`              | WS     | WebSocket connection for live chat           |
| `/api/assignment/submit` | POST   | Solver submits completed assignment          |
| `/api/notify`            | POST   | Send notifications                           |

---

## 🔐 Smart Contract Logic (Solidity Summary)

```solidity
pragma solidity ^0.8.0;

contract AssignmentPayment {
    address public platformOwner;
    mapping(uint => Assignment) public assignments;

    struct Assignment {
        address buyer;
        address solver;
        uint amount;
        bool completed;
        bool paid;
    }

    constructor() {
        platformOwner = msg.sender;
    }

    function createAssignment(uint _id, address _solver) public payable {
        assignments[_id] = Assignment(msg.sender, _solver, msg.value, false, false);
    }

    function markCompleted(uint _id) public {
        require(msg.sender == assignments[_id].solver);
        assignments[_id].completed = true;
    }

    function releasePayment(uint _id) public {
        Assignment storage a = assignments[_id];
        require(a.completed, "Not done yet");
        uint commission = (a.amount * 10) / 100;
        payable(platformOwner).transfer(commission);
        payable(a.solver).transfer(a.amount - commission);
        a.paid = true;
    }
}
```

---

## 🧭 Deployment

### Frontend

* Deploy on **Vercel**:

  ```bash
  npm run build
  vercel deploy
  ```

### Backend

* Deploy Go app on **Amazon EC2**

  ```bash
  docker build -t assignment-backend .
  docker run -p 8080:8080 assignment-backend
  ```

### Smart Contract

* Deploy to **Ethereum Testnet (Goerli or Sepolia)** via Remix/Hardhat.
* Pin metadata on **Pinata**.
* Connect using **MetaMask**.

---

## 🧠 Future Enhancements

* Add AI-based plagiarism detection.
* Introduce solver reputation & rating system.
* Integrate voice chat or meeting scheduling.
* Add multi-currency crypto payments (USDT/ETH).

---

## 👑 Author

**Ashish Watwani**
Engineer | AI & Blockchain Enthusiast | Full Stack Developer
📧 Email: [ashishwatwani@example.com](mailto:ashishwatwani@example.com)
🌐 LinkedIn: [linkedin.com/in/ashishwatwani](#)

---

Would you like me to now generate the **Go backend folder structure with all files (main.go, buyer.go, solver.go, payment.go, nlp.go, smartcontract.go)** next?
That way you can directly run it with your Razorpay API key and MongoDB.
(this is my whole project complete this and fix all the things) (See <attachments> above for file contents. You may not need to search or read the file again.)

# 🔐 AuthentiQ  
### Digital Trust for Academic Identity

AuthentiQ is a **DigiLocker-inspired but trust-minimized certificate verification platform** that enables institutions to issue cryptographically verifiable certificates and allows anyone to instantly verify authenticity using **file-based hashing**.

Unlike traditional document lockers, AuthentiQ focuses on **tamper detection**, **decentralized verification logic**, and **zero-trust validation**, making it ideal for academic and institutional use cases.

---

## 🚀 Key Features

### 🎓 Certificate Issuance (College Portal)
- Upload academic certificates (**PDF / JPG / PNG**)
- Cryptographic **SHA-256 hash generation**
- Metadata binding:
  - Student name  
  - Register number  
  - Institution  
  - Issue date
- Secure storage in **MongoDB with indexed hash lookup**
- **Duplicate prevention** using hash-level uniqueness

---

### ✅ Certificate Verification (Verifier Portal)
- File-based verification (**no manual hash input**)
- Instant authenticity check:
  - **VERIFIED** → Certificate exists & untampered  
  - **TAMPERED** → Hash not found or modified  
  - **ERROR** → Invalid request or system issue
- Deterministic backend responses (**always valid JSON**)

---

## 🛡️ Trust-First Design
- No reliance on user identity or login
- Verification works without knowing the issuer
- Frontend never decides authenticity  
- Backend is the **single source of truth**

---

## 🧠 How AuthentiQ Is Different From DigiLocker

| DigiLocker | AuthentiQ |
|----------|-----------|
| Centralized government locker | Trust-minimized verification |
| Login-based access | File-based verification |
| Document storage | Cryptographic proof |
| No tamper detection | Hash-based integrity check |
| Issuer-controlled | Verifier-independent |

---

## 🧩 Tech Stack

### Frontend
- HTML, CSS (custom premium UI)
- Vanilla JavaScript
- Vite

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose ODM

### Security
- SHA-256 hashing (Web Crypto API)
- Unique indexed hash enforcement
- Deterministic API responses

---

## 🏗️ System Architecture

Certificate File
↓
SHA-256 Hash (Frontend)
↓
MongoDB (Indexed by hash)
↓
Verification API
↓
VERIFIED / TAMPERED / ERROR


---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/notshakti/AuthentiQ.git
cd AuthentiQ



2️⃣ Install dependencies
npm install

3️⃣ Configure environment variables
Create a .env file:
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000

4️⃣ Run the project
# Run frontend + backend together
npm run dev:full

Frontend → http://localhost:5173

Backend → http://localhost:5000

Health Check → http://localhost:5000/api/health

🧪 API Endpoints
Health Check
GET /api/health

Issue Certificate
POST /api/certificates
Body:
{
  "fileHash": "sha256hash",
  "studentName": "...",
  "registerId": "...",
  "certName": "...",
  "issuerName": "...",
  "issueDate": "YYYY-MM-DD"
}

Verify Certificate
POST /api/verify
Body:
{
  "hash": "sha256hash"
}

🛠️ Real-World Engineering Challenges Solved
✅ MongoDB Duplicate Index Bug

Fixed E11000 duplicate key error

Cleaned stale indexes from earlier schema versions

Added controlled unique index on hash

📄 See: MONGODB_INDEX_CLEANUP.md
📜 Script: fix-mongodb-indexes.js

This mirrors real production debugging, not toy projects.

📈 Future Enhancements (Planned)

Time-bound verification links

Issuer reputation scoring

QR-based offline verification

Revocation support

Blockchain anchoring (optional, hybrid model)

Consent-based data sharing

🧑‍💻 Author

Shakti Vijay
Computer Science Student
Project: AuthentiQ – Decentralized Student Identity System

⭐ If you like this project

Star ⭐ the repository and feel free to fork or contribute!

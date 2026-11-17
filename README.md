# CodeNotes Hub 🚀

**CodeNotes Hub** is a clean, secure, and responsive web application designed for students and learners to access curated PDF
programming notes for various subjects like C, C++, Python, Java, and Data Structures & Algorithms (DSA). 

Built using pure HTML5, CSS3, and modern vanilla JavaScript without relying on heavy frameworks or external UI component libraries.

---

## ✨ Features

- **11+ Curated Programming Subjects:** Covers C, C++, Python, Java, OOPs, and DSA notes.
- **Secure Authentication:** 
  - Password hashing using the **Web Crypto API (SHA-256)** — no plaintext passwords are stored.
  - Role-based access control (`admin` and `user` roles).
  - Forgot password workflow with **EmailJS** integration for sending 4-digit OTP verification.
- **Admin Control Panel:**
  - View, add, edit, and delete registered student profiles.
  - Track user download statistics and last login timelines.
  - Modify subject card titles and descriptions dynamically.
- **XSS Protection & Security:** Uses custom HTML sanitization and safe DOM methods (`createElement` + `textContent`)
-  instead of vulnerable `innerHTML` insertions.
- **Custom Modals:** Replaces native `alert()`, `confirm()`, and `prompt()` boxes with sleek, custom-styled modals.
- **Built-in PDF Viewer:** Preview notes directly within a full-screen modal reader with a direct download option.
- **Fully Responsive:** Styled with pure CSS and CSS Grid/Flexbox, optimized for mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid, Custom CSS variables)
- **Scripting:** Vanilla JavaScript (ES6+, Async/Await, Web Crypto API)
- **Services:** [EmailJS](https://www.emailjs.com/) (for OTP email dispatch)
- **Deployment:** [Netlify](https://www.netlify.com/)

---

## 📂 Project Structure

```text
code-notes-hub/
│
├── index.html        # Main application markup (Semantic HTML)
├── style.css         # Pure CSS stylesheet
├── script.js         # Core application logic & security handlers
└── pdfs/             # Folder containing subject PDF study notes
    ├── C_Programming.pdf
    ├── Cpp_Programming.pdf
    └── ...

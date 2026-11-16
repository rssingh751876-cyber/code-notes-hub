

(function () {
    "use strict";

    /* ============================================================
       EMAILJS CONFIGURATION
       ============================================================ */
    const EMAILJS_PUBLIC_KEY  = "#####";
    const EMAILJS_SERVICE_ID  = "#####";
    const EMAILJS_TEMPLATE_ID = "#####";

    const ADMIN_EMAIL = "!!###@gmail.com";

    /* ============================================================
       PASSWORD HASHING (Web Crypto API — SHA-256)
       ============================================================ */

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    /* ============================================================
       XSS PROTECTION — escape user-supplied text
       ============================================================ */

            function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        var map = {
            "&": "\u0026amp;",
            "<": "\u0026lt;",
            ">": "\u0026gt;",
            '"': "\u0026quot;",
            "'": "\u0026#39;"
        };
        return String(str).replace(/[&<>"']/g, function(ch) {
            return map[ch];
        });
    }

    /* ============================================================
       EMAIL VALIDATOR
       ============================================================ */
    function isValidEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    }

    /* ============================================================
       SUBJECT DATA
       ============================================================ */
    const subjectsData = [
        { id: "c",          title: "C Programming",    desc: "Fundamentals of C language, pointers, memory patterns.",  icon: "fa-solid fa-copyright",    iconColor: "text-blue-600",   iconBg: "bg-blue-50" },
        { id: "cpp",        title: "C++ Programming",   desc: "Modern C++ syntax, OOP principles, STL and templates.",    icon: "fa-solid fa-code",          iconColor: "text-indigo-600", iconBg: "bg-indigo-50" },
        { id: "python",     title: "Python Language",   desc: "Python core syntax, fast libraries and clean scripting.",  icon: "fa-brands fa-python",       iconColor: "text-yellow-600", iconBg: "bg-yellow-50" },
        { id: "java",       title: "Core Java",         desc: "Object oriented Java structure, JVM metrics, collections.", icon: "fa-brands fa-java",        iconColor: "text-red-600",    iconBg: "bg-red-50" },
        { id: "oop_cpp",    title: "OOPs in C++",       desc: "Classes, encapsulation, inheritance, polymorphism.",       icon: "fa-solid fa-cubes",         iconColor: "text-purple-600", iconBg: "bg-purple-50" },
        { id: "oop_python", title: "OOPs in Python",    desc: "Advanced object-oriented programming module setups.",       icon: "fa-solid fa-cubes",         iconColor: "text-teal-600",   iconBg: "bg-teal-50" },
        { id: "oop_java",   title: "OOPs in Java",      desc: "Core robust enterprise architecture blueprint metrics.",    icon: "fa-solid fa-cubes",         iconColor: "text-orange-600", iconBg: "bg-orange-50" },
        { id: "dsa_cpp",    title: "DSA in C++",        desc: "Data Structures & Algorithms implementations via C++.",      icon: "fa-solid fa-diagram-project", iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
        { id: "dsa_java",   title: "DSA in Java",       desc: "Array lists, linked lists, complex trees optimization.",    icon: "fa-solid fa-diagram-project", iconColor: "text-rose-600",   iconBg: "bg-rose-50" },
        { id: "dsa_python", title: "DSA in Python",     desc: "Algorithm problem-solving approaches with Python.",        icon: "fa-solid fa-diagram-project", iconColor: "text-cyan-600",   iconBg: "bg-cyan-50" },
        { id: "dsa_c",      title: "DSA in C",          desc: "Classic low-level structures and allocation structures.",    icon: "fa-solid fa-diagram-project", iconColor: "text-sky-600",    iconBg: "bg-sky-50" }
    ];

    const pdfMap = {
        "c":          "pdfs/C_Programming.pdf",
        "cpp":        "pdfs/Cpp_Programming.pdf",
        "python":     "pdfs/Python_Language.pdf",
        "java":       "pdfs/Core_Java.pdf",
        "oop_cpp":    "pdfs/OOPs_in_Cpp.pdf",
        "oop_python": "pdfs/OOPs_in_Python.pdf",
        "oop_java":   "pdfs/OOPs_in_Java.pdf",
        "dsa_cpp":    "pdfs/DSA_in_Cpp.pdf",
        "dsa_java":   "pdfs/DSA_in_Java.pdf",
        "dsa_python": "pdfs/DSA_in_Python.pdf",
        "dsa_c":      "pdfs/DSA_in_C.pdf"
    };

    /* ============================================================
       SESSION
       ============================================================ */
    let currentUser = JSON.parse(sessionStorage.getItem("sessionUser")) || null;

    let generatedOTP   = null;
    let targetResetEmail = null;
    let otpExpiresAt   = null;
    let otpVerified     = false;

    /* ============================================================
       NOTIFICATION
       ============================================================ */
    function showTopNotification(message, type) {
        type = type || "success";
        const container = document.getElementById("top-alert-container");
        const box = document.createElement("div");
        box.className = "notification-banner " + type;
        const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
        const iconEl = document.createElement("i");
        iconEl.className = "fa-solid " + icon;
        const textEl = document.createElement("div");
        textEl.style.flex = "1";
        textEl.textContent = message;
        box.appendChild(iconEl);
        box.appendChild(textEl);
        container.innerHTML = "";
        container.appendChild(box);
        setTimeout(() => {
            box.style.transform = "translateY(-100%)";
            box.style.opacity = "0";
            setTimeout(() => box.remove(), 400);
        }, 3500);
    }

    /* ============================================================
       CUSTOM PROMPT / ALERT / CONFIRM MODALS
       (replaces native prompt(), alert(), confirm())
       ============================================================ */

    function customPrompt(titleText, labelText, defaultVal) {
        return new Promise(resolve => {
            const modal     = document.getElementById("custom-prompt-modal");
            const titleEl   = document.getElementById("custom-prompt-title");
            const descEl    = document.getElementById("custom-prompt-desc");
            const labelEl   = document.getElementById("custom-prompt-label");
            const input     = document.getElementById("custom-prompt-input");
            const okBtn     = document.getElementById("custom-prompt-ok");
            const cancelBtn = document.getElementById("custom-prompt-cancel");
            const alertMsg  = document.getElementById("custom-prompt-alert-msg");

            titleEl.textContent = titleText;
            labelEl.textContent = labelText;
            input.value = defaultVal || "";
            alertMsg.classList.add("hidden");
            alertMsg.textContent = "";

            modal.classList.remove("hidden");
            setTimeout(() => input.focus(), 50);

            function cleanup() {
                okBtn.removeEventListener("click", onOk);
                cancelBtn.removeEventListener("click", onCancel);
                input.removeEventListener("keydown", onKey);
                modal.classList.add("hidden");
            }
            function onOk()      { cleanup(); resolve(input.value); }
            function onCancel()  { cleanup(); resolve(null); }
            function onKey(e)    { if (e.key === "Enter") onOk(); if (e.key === "Escape") onCancel(); }

            okBtn.addEventListener("click", onOk);
            cancelBtn.addEventListener("click", onCancel);
            input.addEventListener("keydown", onKey);
        });
    }

    function customAlert(titleText, message) {
        return new Promise(resolve => {
            const modal     = document.getElementById("custom-prompt-modal");
            const titleEl   = document.getElementById("custom-prompt-title");
            const inputWrap = document.getElementById("custom-prompt-input-wrapper");
            const okBtn     = document.getElementById("custom-prompt-ok");
            const cancelBtn = document.getElementById("custom-prompt-cancel");
            const alertMsg  = document.getElementById("custom-prompt-alert-msg");

            titleEl.textContent = titleText;
            inputWrap.classList.add("hidden");
            alertMsg.textContent = message;
            alertMsg.classList.remove("hidden");

            okBtn.textContent = "OK";
            cancelBtn.classList.add("hidden");
            modal.classList.remove("hidden");

            function cleanup() {
                okBtn.removeEventListener("click", onOk);
                modal.classList.add("hidden");
                inputWrap.classList.remove("hidden");
                cancelBtn.classList.remove("hidden");
                okBtn.textContent = "OK";
            }
            function onOk() { cleanup(); resolve(); }
            okBtn.addEventListener("click", onOk, { once: true });
        });
    }

    function customConfirm(titleText, message) {
        return new Promise(resolve => {
            const modal     = document.getElementById("custom-confirm-modal");
            const titleEl  = document.getElementById("custom-confirm-title");
            const msgEl    = document.getElementById("custom-confirm-message");
            const okBtn    = document.getElementById("custom-confirm-ok");
            const cancelBtn= document.getElementById("custom-confirm-cancel");

            titleEl.textContent = titleText;
            msgEl.textContent   = message;
            modal.classList.remove("hidden");

            function cleanup() {
                okBtn.removeEventListener("click", onOk);
                cancelBtn.removeEventListener("click", onCancel);
                modal.classList.add("hidden");
            }
            function onOk()     { cleanup(); resolve(true); }
            function onCancel() { cleanup(); resolve(false); }

            okBtn.addEventListener("click", onOk);
            cancelBtn.addEventListener("click", onCancel);
        });
    }

    /* ============================================================
       MODAL TOGGLE
       ============================================================ */
    function toggleModal(id) {
        document.getElementById(id).classList.toggle("hidden");
    }

    function switchAuthView(view) {
        const mainForm   = document.getElementById("login-main-form");
        const forgotForm = document.getElementById("forgot-password-form");
        const modalDesc  = document.getElementById("auth-modal-desc");

        if (view === "forgot") {
            mainForm.classList.add("hidden");
            forgotForm.classList.remove("hidden");
            modalDesc.textContent = "Reset your password using your registered email.";
            resetForgotSteps();
        } else {
            mainForm.classList.remove("hidden");
            forgotForm.classList.add("hidden");
            modalDesc.textContent = "Sign in or register a new profile.";
        }
    }

    function resetForgotSteps() {
        document.getElementById("forgot-step-1").classList.remove("hidden");
        document.getElementById("forgot-step-2").classList.add("hidden");
        document.getElementById("forgot-step-3").classList.add("hidden");
        document.getElementById("forgot-email").value = "";
        document.getElementById("verify-otp-input").value = "";
        document.getElementById("forgot-new-password").value = "";
        generatedOTP = null;
        targetResetEmail = null;
        otpExpiresAt = null;
        otpVerified = false;
    }

    /* ============================================================
       OTP — SEND via EmailJS
       ============================================================ */
    async function generateMockOTP() {
        const emailInput = document.getElementById("forgot-email");
        const email = emailInput.value.trim().toLowerCase();

        if (!email) { showTopNotification("Please enter your email address.", "error"); return; }
        if (!isValidEmail(email)) { showTopNotification("Invalid email address. Please enter a valid email.", "error"); return; }

        const users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        const user = users.find(u => u.email === email);

        if (!user) { showTopNotification("This email is not registered. Please sign in/register first.", "error"); return; }

        if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
            showTopNotification("EmailJS configuration is missing.", "error");
            return;
        }

        generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        targetResetEmail = email;
        otpExpiresAt = Date.now() + (5 * 60 * 1000);
        otpVerified = false;

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                user_name: user.name,
                user_email: user.email,
                otp: generatedOTP
            });

            document.getElementById("forgot-step-1").classList.add("hidden");
            document.getElementById("forgot-step-2").classList.remove("hidden");
            document.getElementById("show-otp").textContent = "Check your email";
            showTopNotification("OTP sent successfully. Please check your email.", "success");

        } catch (error) {
            console.error("EmailJS error:", error);
            generatedOTP = null;
            targetResetEmail = null;
            otpExpiresAt = null;
            showTopNotification("Unable to send OTP. Check the browser console for the EmailJS error.", "error");
        }
    }

    /* ============================================================
       OTP — VERIFY
       ============================================================ */
    function verifyOTPCode() {
        const inputVal = document.getElementById("verify-otp-input").value.trim();

        if (!inputVal) { showTopNotification("Please enter the OTP sent to your email.", "error"); return; }
        if (!/^\d{4}$/.test(inputVal)) { showTopNotification("OTP must contain exactly 4 digits.", "error"); return; }

        if (!generatedOTP || !otpExpiresAt || Date.now() > otpExpiresAt) {
            generatedOTP = null;
            showTopNotification("OTP has expired. Please request a new OTP.", "error");
            return;
        }

        if (inputVal !== generatedOTP) { showTopNotification("Invalid OTP. Please check your email and try again.", "error"); return; }

        otpVerified = true;
        document.getElementById("forgot-step-2").classList.add("hidden");
        document.getElementById("forgot-step-3").classList.remove("hidden");
        showTopNotification("OTP verified successfully. Set your new password.", "success");
    }

    /* ============================================================
       SAVE NEW PASSWORD (after OTP verified)
       ============================================================ */
    async function saveNewPassword() {
        if (!otpVerified) { showTopNotification("Please verify the OTP first.", "error"); return; }
        if (!otpExpiresAt || Date.now() > otpExpiresAt) {
            showTopNotification("OTP has expired. Please request a new OTP.", "error");
            return;
        }

        const newPass = document.getElementById("forgot-new-password").value;

        if (newPass.length < 4) { showTopNotification("Password must be at least 4 characters long.", "error"); return; }

        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        const userIndex = users.findIndex(u => u.email === targetResetEmail);

        if (userIndex === -1) { showTopNotification("Account not found. Please register first.", "error"); return; }

        /* Hash the new password before storing */
        users[userIndex].passwordHash = await hashPassword(newPass);
        delete users[userIndex].password;
        users[userIndex].lastLogin = new Date().toLocaleString();

        localStorage.setItem("usersDatabase", JSON.stringify(users));

        currentUser = users[userIndex];
        delete currentUser.passwordHash;  /* Never keep hash in session */
        sessionStorage.setItem("sessionUser", JSON.stringify(currentUser));

        generatedOTP = null;
        targetResetEmail = null;
        otpExpiresAt = null;
        otpVerified = false;

        showTopNotification("Password updated successfully. You are now signed in.", "success");
        toggleModal("signin-modal");
        switchAuthView("login");
        checkSession();
    }

    /* ============================================================
       LOGIN / REGISTER
       ============================================================ */
    async function handleLogin(e) {
        e.preventDefault();

        const name     = document.getElementById("login-name").value.trim();
        const email    = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        if (!isValidEmail(email)) { showTopNotification("Please enter a valid email address.", "error"); return; }

        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        const currentTime = new Date().toLocaleString();
        const userIndex = users.findIndex(u => u.email === email);

        let sessionUserObject = null;

        /* NEW USER */
        if (userIndex === -1) {
            const assignedRole = email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
            const hashedPwd = await hashPassword(password);

            sessionUserObject = {
                id: Date.now(),
                name: name,
                email: email,
                passwordHash: hashedPwd,
                role: assignedRole,
                lastLogin: currentTime,
                downloads: 0
            };

            users.push(sessionUserObject);
            localStorage.setItem("usersDatabase", JSON.stringify(users));

            showTopNotification("Success! Account \"" + name + "\" registered as " + assignedRole.toUpperCase(), "success");

        /* EXISTING USER */
        } else {
            const hashedPwd = await hashPassword(password);

            if (users[userIndex].passwordHash !== hashedPwd) {
                showTopNotification("Login Failed: Incorrect Password!", "error");
                return;
            }

            if (email === ADMIN_EMAIL.toLowerCase()) {
                users[userIndex].role = "admin";
            }

            users[userIndex].lastLogin = currentTime;
            sessionUserObject = users[userIndex];

            localStorage.setItem("usersDatabase", JSON.stringify(users));
            showTopNotification("Welcome back, " + sessionUserObject.name + "!", "success");
        }

        /* Store session WITHOUT password hash */
        currentUser = {
            id: sessionUserObject.id,
            name: sessionUserObject.name,
            email: sessionUserObject.email,
            role: sessionUserObject.role,
            lastLogin: sessionUserObject.lastLogin,
            downloads: sessionUserObject.downloads || 0
        };

        sessionStorage.setItem("sessionUser", JSON.stringify(currentUser));

        document.getElementById("login-name").value = "";
        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";
        document.getElementById("signin-modal").classList.add("hidden");

        checkSession();
    }

    /* ============================================================
       SESSION CHECK
       ============================================================ */
    function checkSession() {
        const authBtn         = document.getElementById("auth-btn");
        const userWelcome     = document.getElementById("user-welcome");
        const adminDashboard  = document.getElementById("admin-dashboard");
        const adminBadge      = document.getElementById("admin-badge");
        const adminInfoText   = document.getElementById("admin-info-text");

        if (currentUser) {
            authBtn.textContent = "Logout";
            userWelcome.textContent = "Hi, " + currentUser.name;
            userWelcome.classList.remove("hidden");

            if (currentUser.role === "admin") {
                adminDashboard.classList.remove("hidden");
                adminBadge.classList.remove("hidden");
                adminInfoText.classList.remove("hidden");
                renderAdminDashboard();
            } else {
                adminDashboard.classList.add("hidden");
                adminBadge.classList.add("hidden");
                adminInfoText.classList.add("hidden");
            }
        } else {
            authBtn.textContent = "Sign in";
            userWelcome.classList.add("hidden");
            adminDashboard.classList.add("hidden");
            adminBadge.classList.add("hidden");
            adminInfoText.classList.add("hidden");
        }

        renderSubjects();
    }

    /* ============================================================
       AUTH BUTTON
       ============================================================ */
    function handleAuthAction() {
        if (currentUser) {
            currentUser = null;
            sessionStorage.removeItem("sessionUser");
            checkSession();
            showTopNotification("Logged out successfully", "success");
        } else {
            toggleModal("signin-modal");
            switchAuthView("login");
        }
    }

    /* ============================================================
       SUBJECT CARDS — uses createElement + textContent (XSS-safe)
       ============================================================ */
    function renderSubjects() {
        const grid = document.getElementById("subjects-grid");
        const isAdmin = currentUser && currentUser.role === "admin";

        grid.innerHTML = "";

        subjectsData.forEach(sub => {
            const card = document.createElement("div");
            card.className = "subject-card";

            /* Top section */
            const top = document.createElement("div");
            top.className = "subject-card-top";

            const iconBox = document.createElement("div");
            iconBox.className = "subject-card-icon-box " + sub.iconBg + " " + sub.iconColor;
            const iconEl = document.createElement("i");
            iconEl.className = sub.icon;
            iconBox.appendChild(iconEl);

            const title = document.createElement("h3");
            title.className = "subject-card-title";
            title.textContent = sub.title;

            const desc = document.createElement("p");
            desc.className = "subject-card-desc";
            desc.textContent = sub.desc;

            top.appendChild(iconBox);
            top.appendChild(title);
            top.appendChild(desc);

            /* Actions */
            const actions = document.createElement("div");
            actions.className = "subject-card-actions";

            const dlBtn = document.createElement("button");
            dlBtn.type = "button";
            dlBtn.className = "subject-download-btn";
            const dlIcon = document.createElement("i");
            dlIcon.className = "fa-solid fa-file-pdf";
            dlIcon.style.fontSize = "0.75rem";
            dlBtn.appendChild(dlIcon);
            dlBtn.appendChild(document.createTextNode(" Download PDF"));
            dlBtn.addEventListener("click", () => handleDownload(sub.title));
            actions.appendChild(dlBtn);

            if (isAdmin) {
                const editBtn = document.createElement("button");
                editBtn.type = "button";
                editBtn.className = "subject-edit-btn";
                const editIcon = document.createElement("i");
                editIcon.className = "fa-solid fa-pen";
                editBtn.appendChild(editIcon);
                editBtn.appendChild(document.createTextNode(" Edit Subject Card"));
                editBtn.addEventListener("click", () => modifySubjectPrompt(sub.id));
                actions.appendChild(editBtn);
            }

            card.appendChild(top);
            card.appendChild(actions);
            grid.appendChild(card);
        });
    }

    /* ============================================================
       ADMIN DASHBOARD — uses createElement + textContent (XSS-safe)
       ============================================================ */
    function renderAdminDashboard() {
        const users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        const tableBody = document.getElementById("users-table-body");

        tableBody.innerHTML = "";

        users.forEach(user => {
            const tr = document.createElement("tr");

            /* Name */
            const tdName = document.createElement("td");
            tdName.className = "td-name";
            tdName.textContent = user.name;
            tr.appendChild(tdName);

            /* Email */
            const tdEmail = document.createElement("td");
            tdEmail.className = "td-email";
            tdEmail.textContent = user.email;
            tr.appendChild(tdEmail);

            /* Role */
            const tdRole = document.createElement("td");
            const roleSpan = document.createElement("span");
            roleSpan.className = "role-badge " + (user.role === "admin" ? "admin" : "user");
            roleSpan.textContent = user.role;
            tdRole.appendChild(roleSpan);
            tr.appendChild(tdRole);

            /* Last Login */
            const tdLogin = document.createElement("td");
            tdLogin.className = "td-login";
            tdLogin.textContent = user.lastLogin || "Never";
            tr.appendChild(tdLogin);

            /* Downloads */
            const tdDl = document.createElement("td");
            tdDl.className = "td-downloads";
            tdDl.textContent = user.downloads || 0;
            tr.appendChild(tdDl);

            /* Actions */
            const tdActions = document.createElement("td");
            tdActions.className = "td-actions";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "action-btn edit";
            const editIcon = document.createElement("i");
            editIcon.className = "fa-solid fa-pen";
            editBtn.appendChild(editIcon);
            editBtn.appendChild(document.createTextNode(" Edit"));
            editBtn.addEventListener("click", () => editUserPrompt(user.id));
            tdActions.appendChild(editBtn);

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "action-btn delete";
            const delIcon = document.createElement("i");
            delIcon.className = "fa-solid fa-trash";
            delBtn.appendChild(delIcon);
            delBtn.appendChild(document.createTextNode(" Delete"));
            delBtn.addEventListener("click", () => deleteUser(user.id));
            tdActions.appendChild(delBtn);

            tr.appendChild(tdActions);
            tableBody.appendChild(tr);
        });
    }

    /* ============================================================
       ADD USER (admin)
       ============================================================ */
    async function addNewUserPrompt() {
        const name = await customPrompt("Add New User", "Enter User's Full Name:", "");
        if (name === null) return;

        const email = (await customPrompt("Add New User", "Enter User's Email:", ""))?.trim().toLowerCase();
        if (email === null) return;

        const pass = await customPrompt("Add New User", "Set User's Password:", "");
        if (pass === null) return;

        if (!name || !email || !pass) return;

        if (!isValidEmail(email)) {
            await customAlert("Validation Error", "Please enter a valid Email address!");
            return;
        }

        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];

        if (users.some(u => u.email === email)) {
            await customAlert("Duplicate", "This email is already registered!");
            return;
        }

        const hashedPwd = await hashPassword(pass);

        users.push({
            id: Date.now(),
            name: name,
            email: email,
            passwordHash: hashedPwd,
            role: "user",
            lastLogin: "Never",
            downloads: 0
        });

        localStorage.setItem("usersDatabase", JSON.stringify(users));
        renderAdminDashboard();
        showTopNotification("User registered manually inside panel", "success");
    }

    /* ============================================================
       EDIT USER (admin)
       ============================================================ */
    async function editUserPrompt(id) {
        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        let user = users.find(u => u.id === id);
        if (!user) return;

        const newName = await customPrompt("Modify Name", "Modify Name:", user.name);
        if (newName === null) return;

        const newEmail = (await customPrompt("Modify Email", "Modify Email:", user.email))?.trim().toLowerCase();
        if (newEmail === null) return;

        const newPass = await customPrompt("Modify Password", "Modify Password (leave blank to keep same):", "");
        if (newPass === null) return;

        const newDownloads = await customPrompt("Modify Downloads", "Modify Downloads Count:", user.downloads || 0);
        if (newDownloads === null) return;

        if (newName) user.name = newName;

        if (newPass && newPass.length >= 4) {
            user.passwordHash = await hashPassword(newPass);
        }

        if (newEmail) {
            if (!isValidEmail(newEmail)) {
                await customAlert("Validation Error", "Please enter a valid Email address!");
                return;
            }
            if (users.some(u => u.email === newEmail && u.id !== id)) {
                await customAlert("Duplicate", "This email is already in use!");
                return;
            }
            user.email = newEmail;
        }

        user.downloads = parseInt(newDownloads) || 0;

        localStorage.setItem("usersDatabase", JSON.stringify(users));
        renderAdminDashboard();
        showTopNotification("Student attributes updated successfully", "success");
    }

    /* ============================================================
       DELETE USER (admin)
       ============================================================ */
    async function deleteUser(id) {
        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        let user = users.find(u => u.id === id);

        if (user && user.role === "admin") {
            await customAlert("Critical System Guard", "You cannot delete the primary Admin account!");
            return;
        }

        const confirmed = await customConfirm("Delete User", "Are you sure you want to remove this user profile?");
        if (!confirmed) return;

        users = users.filter(u => u.id !== id);
        localStorage.setItem("usersDatabase", JSON.stringify(users));
        renderAdminDashboard();
        showTopNotification("User entry deleted successfully", "success");
    }

    /* ============================================================
       MODIFY SUBJECT (admin)
       ============================================================ */
    async function modifySubjectPrompt(id) {
        let sub = subjectsData.find(s => s.id === id);
        if (!sub) return;

        const newTitle = await customPrompt("Edit Subject", "Edit Subject Title:", sub.title);
        if (newTitle === null) return;

        const newDesc = await customPrompt("Edit Subject", "Edit Subject Description:", sub.desc);
        if (newDesc === null) return;

        if (newTitle) sub.title = newTitle;
        if (newDesc)  sub.desc  = newDesc;

        renderSubjects();
        showTopNotification("Subject layout updated successfully", "success");
    }

    /* ============================================================
       DOWNLOAD
       ============================================================ */
    function handleDownload(title) {
        if (!currentUser) {
            showTopNotification("Access Denied: Please Sign in first to unlock downloads.", "error");
            toggleModal("signin-modal");
            return;
        }

        const sub = subjectsData.find(s => s.title === title);
        const pdfUrl = sub ? pdfMap[sub.id] : "";

        if (!sub || !pdfUrl) {
            showTopNotification("Sorry! " + title + " PDF is not available yet.", "error");
            return;
        }

        openPdfViewer(sub.title, pdfUrl);

        let users = JSON.parse(localStorage.getItem("usersDatabase")) || [];
        let user = users.find(u => u.email === currentUser.email);

        if (user) {
            user.downloads = (user.downloads || 0) + 1;
            localStorage.setItem("usersDatabase", JSON.stringify(users));
            currentUser.downloads = user.downloads;
            sessionStorage.setItem("sessionUser", JSON.stringify(currentUser));

            if (currentUser.role === "admin") {
                renderAdminDashboard();
            }
        }
    }

    /* ============================================================
       PDF VIEWER
       ============================================================ */
    function openPdfViewer(pdfTitle, pdfUrl) {
        const modal         = document.getElementById("pdf-modal");
        const frame         = document.getElementById("pdf-frame");
        const titleEl       = document.getElementById("pdf-modal-title");
        const downloadBtn   = document.getElementById("pdf-download-direct");

        /* Use textContent for title (XSS-safe) */
        titleEl.innerHTML = '<i class="fa-solid fa-file-pdf pdf-modal-icon"></i> ';
        titleEl.appendChild(document.createTextNode(pdfTitle));

        frame.src = pdfUrl;
        downloadBtn.href = pdfUrl;
        downloadBtn.download = pdfTitle + ".pdf";
        downloadBtn.target = "_self";

        modal.classList.remove("hidden");
    }

    function closePdfViewer() {
        const modal = document.getElementById("pdf-modal");
        const frame = document.getElementById("pdf-frame");
        frame.src = "";
        modal.classList.add("hidden");
    }

    /* ============================================================
       EVENT LISTENERS (replaces all inline onclick)
       ============================================================ */
    function initEventListeners() {
        /* Auth button */
        document.getElementById("auth-btn").addEventListener("click", handleAuthAction);

        /* Login form */
        document.getElementById("login-main-form").addEventListener("submit", handleLogin);

        /* Forgot password link */
        document.getElementById("forgot-password-btn").addEventListener("click", () => switchAuthView("forgot"));

        /* Back to login */
        document.getElementById("back-to-login-btn").addEventListener("click", () => switchAuthView("login"));

        /* OTP buttons */
        document.getElementById("send-otp-btn").addEventListener("click", generateMockOTP);
        document.getElementById("verify-otp-btn").addEventListener("click", verifyOTPCode);
        document.getElementById("save-password-btn").addEventListener("click", saveNewPassword);

        /* Admin — Add user */
        document.getElementById("add-user-btn").addEventListener("click", addNewUserPrompt);

        /* PDF modal close */
        document.getElementById("pdf-close-btn").addEventListener("click", closePdfViewer);

        /* All modal close buttons (data-close attribute) */
        document.querySelectorAll("[data-close]").forEach(btn => {
            btn.addEventListener("click", () => toggleModal(btn.dataset.close));
        });

        /* Escape key — close PDF viewer or any open modal */
        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            const pdfModal = document.getElementById("pdf-modal");
            if (!pdfModal.classList.contains("hidden")) {
                closePdfViewer();
                return;
            }
            /* Close any other open modal */
            ["signin-modal", "custom-prompt-modal", "custom-confirm-modal"].forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.classList.contains("hidden")) {
                    el.classList.add("hidden");
                }
            });
        });

        /* Click outside modal to close */
        document.querySelectorAll(".modal-overlay").forEach(overlay => {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    overlay.classList.add("hidden");
                }
            });
        });
    }

    /* ============================================================
       INITIALIZE
       ============================================================ */
    function init() {
        /* Initialize localStorage if empty */
        if (!localStorage.getItem("usersDatabase")) {
            localStorage.setItem("usersDatabase", JSON.stringify([]));
        }

        /* Initialize EmailJS */
        if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
            emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        }

        /* Attach all event listeners */
        initEventListeners();

        /* Render initial state */
        checkSession();
    }

    /* DOM ready */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();

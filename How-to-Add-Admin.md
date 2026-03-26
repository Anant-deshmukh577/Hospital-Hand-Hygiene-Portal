# 🔑 How to Add or Change Admin & Auditor Credentials

> A quick guide to managing admin and auditor accounts in the Hospital Hand Hygiene Portal.

---

## ⚡ Easiest Method (3 Steps)

### Step 1: Open the Configuration File

Open this file in your code editor:

```
backend/scripts/quickAddAdmin.js
```

### Step 2: Change the Email and Password

Find lines 10–30 and update the credentials:

```javascript
const ADMIN_CONFIG = {
  name: 'Admin User',
  email: 'admin@hospital.edu',      // ← Change this
  password: 'Admin@123',            // ← Change this
  phone: '9876543210',
  department: 'Administration',
  designation: 'Consultant',
};

const AUDITOR_CONFIG = {
  name: 'Dr. Auditor',
  email: 'auditor@hospital.edu',    // ← Change this
  password: 'Auditor@123',          // ← Change this
  phone: '9876543211',
  department: 'Administration',
  designation: 'Consultant',
};
```

### Step 3: Run the Script

Open your terminal and run:

```bash
cd backend
node scripts/quickAddAdmin.js
```

✅ Done! Your admin and auditor accounts are ready to use.

---

## 🖥️ Alternative: Interactive Menu

If you need more control — like managing multiple users or deleting accounts — use the interactive menu:

```bash
cd backend
node scripts/manageAdminAuditor.js
```

This gives you options to:

| Option | Description |
|--------|-------------|
| ➕ Create / Update Admin | Add a new admin or update an existing one |
| ➕ Create / Update Auditor | Add a new auditor or update an existing one |
| 📋 List Admins | View all admin users |
| 📋 List Auditors | View all auditor users |
| 🗑️ Delete Admin | Remove an admin account |
| 🗑️ Delete Auditor | Remove an auditor account |

---

## 🔐 Current Default Credentials

> ⚠️ **Change these before deploying to production.**

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| **Admin** | `admin@hospital.edu` | `Admin@123` | `/admin-login` |
| **Auditor** | `auditor@hospital.edu` | `Auditor@123` | `/auditor-login` |

---

## 💡 Quick Tips

- **No duplicates** — running the script multiple times will update existing users instead of creating duplicates
- **Password rules** — must be at least 8 characters long
- **Email format** — must be valid, e.g. `user@domain.com`
- **Server-safe** — the script works even while your server is running
- **No limit** — you can create as many admin and auditor accounts as you need

---

## 📚 More Information

| File | Description |
|------|-------------|
| `EASY_ADMIN_SETUP.md` | Simple guide with examples |
| `backend/scripts/README.md` | Complete script documentation |
| `LOGIN_CREDENTIALS.md` | All test credentials |

---

## 🔧 Troubleshooting

<details>
<summary><strong>"MongoDB connection failed"</strong></summary>

Make sure MongoDB is running on your machine. Start it with:

```bash
# Windows
net start MongoDB

# macOS / Linux
sudo systemctl start mongod
```

</details>

<details>
<summary><strong>"Invalid email format"</strong></summary>

Emails must follow the format `user@domain.com`. Check for typos or missing characters.

</details>

<details>
<summary><strong>"Password too short"</strong></summary>

Passwords must be at least 8 characters long. Use a stronger password before retrying.

</details>

---

<div align="center">

*Easy credential management for your Hospital Hand Hygiene Portal.*

</div>
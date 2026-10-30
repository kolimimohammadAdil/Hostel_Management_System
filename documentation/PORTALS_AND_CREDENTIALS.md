# ALTS Hostel Portal — Portals & Credentials Guide

All accounts are persisted in **MongoDB Atlas** with salted bcrypt passwords.

### Institutional Entry Point: `http://localhost:5173/login`

| Portal Name | System Role | Authorized Path | Email / Username | Alternate ID (Roll No) | Password |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Student (Girls)** | `student` | `/student` | `student.priya@hostelguard.edu` | `21CS042` | `HostelGuard#2026` |
| **Student (Boys)** | `student` | `/student` | `student.aarav@hostelguard.edu` | `21CS089` | `HostelGuard#2026` |
| **Girls Hostel Warden** | `girls_warden` | `/girls-warden` | `warden.girls@hostelguard.edu` | — | `HostelGuard#2026` |
| **Boys Hostel Warden** | `boys_warden` | `/boys-warden` | `warden.boys@hostelguard.edu` | — | `HostelGuard#2026` |
| **Gate Security** | `gate_security` | `/gate-security` | `security.gate@hostelguard.edu` | — | `HostelGuard#2026` |
| **Parent Portal** | `parent` | `/parent` | `parent.sharma@hostelguard.edu` | — | `HostelGuard#2026` |
| **Mess Incharge** | `mess_incharge` | `/mess-incharge` | `mess.incharge@hostelguard.edu` | — | `HostelGuard#2026` |
| **Hostel Maintenance** | `maintenance_incharge` | `/maintenance-incharge` | `maintenance.incharge@hostelguard.edu` | — | `HostelGuard#2026` |

---

### Provisioning New Accounts
To provision a new account administratively:
```powershell
npm run provision:user -- --name "Staff Member" --email "staff@alts.edu.in" --password "SecurePass#2026" --role boys_warden
```


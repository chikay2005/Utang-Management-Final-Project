# Sari-Sari Store Utang Management System

A beginner-friendly full-stack school project using React + Vite, Node.js + Express, and local MongoDB.

## Features
- Dashboard totals in Philippine Peso (₱)
- Add, edit, search, and delete customers
- Record customer utang (credit purchases)
- Record partial or full payments
- Automatically calculate each debt's remaining balance
- Transaction history
- Warm cream, beige, and brown interface

## Requirements
- Node.js 20.19+ or 22.12+ (LTS recommended)
- MongoDB Community Server running locally
- (Optional) MongoDB Compass to view collections
- VS Code

## 1. Install and start MongoDB
Install MongoDB Community Server for Windows from:
https://www.mongodb.com/try/download/community

During setup, choose to install MongoDB as a Windows Service. This normally starts MongoDB automatically.
You can also install MongoDB Compass:
https://www.mongodb.com/try/download/compass

Check that MongoDB is running. Open PowerShell or Command Prompt and run:
```bash
mongosh
```
If the shell connects, MongoDB is running. Type `exit` to leave.
If `mongosh` is not recognized, install MongoDB Shell:
https://www.mongodb.com/try/download/shell

Default local connection used by this project:
`mongodb://127.0.0.1:27017/sari_sari_utang`

## 2. Open the project in VS Code
Extract `SariSariUtangSystem.zip`.
In VS Code choose File > Open Folder, then select the extracted `SariSariUtangSystem` folder.

## 3. Start the backend
Open Terminal > New Terminal in VS Code:
```bash
cd backend
npm install
npm run dev
```
You should see a message similar to:
`MongoDB connected: 127.0.0.1`
`API running at http://localhost:5000`

Keep this terminal running.

## 4. Start the frontend
Open a SECOND terminal in VS Code (Terminal > New Terminal):
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually:
`http://localhost:5173`

Keep both terminals running while using the app.

## 5. How to use the system
1. Open Customers and add a customer.
2. Open Utang Records and record a credit purchase for that customer.
3. Open Payments and select the debt/customer, then record the amount received.
4. The balance is calculated as: original utang - payments.
5. Dashboard and History update from the database.

All amounts are entered as Philippine pesos. The interface displays them as `₱1,500.00`.

## 6. View the database in MongoDB Compass
Connect Compass to:
`mongodb://127.0.0.1:27017`
Open database `sari_sari_utang`. Collections are created automatically when records are first saved:
- `customers`
- `debts`
- `payments`

## Troubleshooting
- **ECONNREFUSED / cannot connect:** Make sure MongoDB Server is installed and its Windows service is running. Restart the MongoDB service from Windows Services, then restart the backend.
- **mongosh not recognized:** Install MongoDB Shell separately, or use Compass to test the server connection.
- **Port 5000 already in use:** Close the other app using port 5000, or change `PORT` in `backend/.env` and the frontend API URL in `frontend/src/api.js`.
- **Port 5173 busy:** Vite may offer another port; open the URL it prints.
- **No data appears:** Make sure both backend and frontend terminals are running and that the backend says MongoDB connected.

## Important project notes
- This is a local development/school-project version. The data is stored in MongoDB on this laptop, not automatically shared with other devices.
- Do not expose the Express API to the public internet as-is. A real deployment needs authentication, authorization, HTTPS, backups, and additional security.
- Deleting a customer also deletes that customer's debt and payment records. The app asks for confirmation first.
- The app stores money as integer centavos in the database to avoid floating-point rounding errors. For example, ₱12.50 is stored as 1250 centavos.


## First-time setup on Windows / Git Bash

Create the backend environment file before starting the server:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

In a second Git Bash window:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Keep both terminals running. Do not commit `.env` or `node_modules`.

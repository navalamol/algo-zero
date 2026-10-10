# MongoDB Setup Guide

## Windows Installation

### Option 1: Using MongoDB Installer (Recommended)

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download the MSI installer

2. **Install MongoDB**
   ```powershell
   # Run the installer and follow these steps:
   # - Choose "Complete" installation
   # - Install MongoDB as a Service (recommended)
   # - Install MongoDB Compass (GUI tool - optional but helpful)
   ```

3. **Verify Installation**
   ```powershell
   # Check MongoDB version
   mongod --version
   
   # Check if service is running
   Get-Service MongoDB
   ```

4. **Start MongoDB Service**
   ```powershell
   # If not running, start it:
   net start MongoDB
   
   # Check status:
   Get-Service MongoDB
   ```

### Option 2: Using Chocolatey

```powershell
# Install Chocolatey if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb

# Start MongoDB
mongod
```

### Option 3: Manual Installation

1. **Download and Extract**
   ```powershell
   # Download from https://www.mongodb.com/try/download/community
   # Extract to C:\Program Files\MongoDB\Server\7.0\
   ```

2. **Create Data Directory**
   ```powershell
   mkdir C:\data\db
   ```

3. **Start MongoDB**
   ```powershell
   # Navigate to MongoDB bin folder
   cd "C:\Program Files\MongoDB\Server\7.0\bin"
   
   # Start server
   .\mongod.exe --dbpath="C:\data\db"
   ```

## Linux Installation

### Ubuntu/Debian

```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### CentOS/RHEL

```bash
# Create repo file
sudo vim /etc/yum.repos.d/mongodb-org-7.0.repo

# Add:
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc

# Install
sudo yum install -y mongodb-org

# Start
sudo systemctl start mongod
sudo systemctl enable mongod
```

## macOS Installation

### Using Homebrew

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Tap MongoDB
brew tap mongodb/brew

# Install MongoDB
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0

# Check status
brew services list
```

## Verify MongoDB Installation

### Test Connection

```powershell
# Windows PowerShell or bash
mongosh

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/
# Using MongoDB: 7.0.x
```

### Create Database and Test

```javascript
// In mongosh:
use kite-algo-trading

// Create a test document
db.test.insertOne({ message: "Hello MongoDB!" })

// Verify
db.test.find()

// You should see your document
```

## MongoDB Compass (GUI Tool)

### Installation

1. **Download**: https://www.mongodb.com/try/download/compass
2. **Install** the application
3. **Connect** to: `mongodb://localhost:27017`

### Using Compass

- View databases and collections
- Browse documents
- Run queries visually
- Analyze performance
- Import/Export data

## Configure MongoDB for the Project

### Update Connection String

Edit `.env` file:

```env
# Default local connection
MONGODB_URI=mongodb://localhost:27017/kite-algo-trading

# Or with authentication (if configured):
MONGODB_URI=mongodb://username:password@localhost:27017/kite-algo-trading

# Or MongoDB Atlas (cloud):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kite-algo-trading
```

## Using MongoDB Atlas (Cloud) - Alternative

If you don't want to install MongoDB locally:

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create a free cluster**
3. **Get connection string**
4. **Update .env**:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kite-algo-trading?retryWrites=true&w=majority
```

## Common Commands

### Windows PowerShell

```powershell
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Restart MongoDB
net stop MongoDB; net start MongoDB

# Check if running
Get-Service MongoDB

# Connect to MongoDB shell
mongosh
```

### Linux/Mac

```bash
# Start MongoDB
sudo systemctl start mongod    # Linux
brew services start mongodb-community@7.0  # Mac

# Stop MongoDB
sudo systemctl stop mongod     # Linux
brew services stop mongodb-community@7.0   # Mac

# Restart MongoDB
sudo systemctl restart mongod  # Linux
brew services restart mongodb-community@7.0  # Mac

# Check status
sudo systemctl status mongod   # Linux
brew services list             # Mac

# Connect to shell
mongosh
```

## Troubleshooting

### Issue: MongoDB won't start

**Solution 1: Check data directory**
```powershell
# Windows
mkdir C:\data\db

# Linux/Mac
sudo mkdir -p /data/db
sudo chown -R `whoami` /data/db
```

**Solution 2: Check if port is in use**
```powershell
# Windows
netstat -ano | findstr :27017

# Linux/Mac
lsof -i :27017
```

**Solution 3: Check logs**
```powershell
# Windows
type "C:\Program Files\MongoDB\Server\7.0\log\mongod.log"

# Linux
sudo tail -f /var/log/mongodb/mongod.log
```

### Issue: Connection refused

**Solution:**
```powershell
# Ensure MongoDB is running
Get-Service MongoDB  # Windows
sudo systemctl status mongod  # Linux

# Try connecting to localhost
mongosh mongodb://localhost:27017
```

### Issue: Access denied

**Solution:**
```bash
# If authentication is enabled, connect with credentials
mongosh mongodb://username:password@localhost:27017/admin
```

## Best Practices

1. **Regular Backups**
   ```bash
   mongodump --db kite-algo-trading --out /backup/
   ```

2. **Monitor Performance**
   - Use MongoDB Compass
   - Check slow queries
   - Monitor memory usage

3. **Security**
   - Enable authentication in production
   - Use strong passwords
   - Limit network access
   - Keep MongoDB updated

4. **Indexing**
   The app automatically creates indexes, but you can verify:
   ```javascript
   use kite-algo-trading
   db.stocks.getIndexes()
   db.strategies.getIndexes()
   db.trades.getIndexes()
   ```

## Data Persistence

MongoDB automatically saves data to disk. Your data locations:

- **Windows**: `C:\data\db`
- **Linux**: `/var/lib/mongodb`
- **macOS**: `/usr/local/var/mongodb`

## Next Steps

Once MongoDB is running:

1. ✅ Start MongoDB service
2. ✅ Verify connection with `mongosh`
3. ✅ Run the application
4. ✅ Check database creation in Compass
5. ✅ Monitor collections as data is added

Your application will automatically:
- Create the database `kite-algo-trading`
- Create collections (stocks, strategies, trades, watchlists)
- Add indexes for performance
- Store all trading data

## Quick Start Checklist

- [ ] MongoDB installed
- [ ] MongoDB service running
- [ ] Can connect via `mongosh`
- [ ] `.env` has correct `MONGODB_URI`
- [ ] Application can connect to database

If all checks pass, you're ready to run the trading platform! 🚀

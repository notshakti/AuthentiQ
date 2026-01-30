# MongoDB Index Cleanup Guide

## Problem
- MongoDB throws `E11000 duplicate key error` on `fileHash_1`
- Schema now uses `hash` field, not `fileHash`
- Stale unique index on `fileHash_1` causes conflicts
- MongoDB treats missing/null fields as duplicates in unique indexes

## Solution

### Option 1: Automated Script (Recommended)

Run the cleanup script:

```bash
node fix-mongodb-indexes.js
```

This script will:
1. Connect to MongoDB
2. List all current indexes
3. Remove stale `fileHash_1` and `fileHash_1_1` indexes
4. Ensure unique index exists on `hash` field
5. Display final index list

### Option 2: Manual MongoDB Shell Commands

Connect to MongoDB:

```bash
mongosh "YOUR_MONGODB_URI"
```

Or if using MongoDB Compass, open the MongoDB Shell.

Then run:

```javascript
// Switch to your database
use your_database_name

// List current indexes
db.certificates.getIndexes()

// Drop stale fileHash indexes
db.certificates.dropIndex("fileHash_1")
db.certificates.dropIndex("fileHash_1_1")  // If exists

// Ensure hash index exists (unique)
db.certificates.createIndex({ hash: 1 }, { unique: true, name: "hash_1" })

// Verify indexes
db.certificates.getIndexes()
```

### Option 3: MongoDB Atlas UI

1. Go to MongoDB Atlas → Your Cluster → Collections
2. Select `certificates` collection
3. Go to "Indexes" tab
4. Find and delete `fileHash_1` index
5. Verify `hash_1` unique index exists
6. If missing, create it: `{ hash: 1 }` with unique constraint

## Verification Checklist

After cleanup, verify:

- [ ] `fileHash_1` index is removed
- [ ] `fileHash_1_1` index is removed (if it existed)
- [ ] `hash_1` unique index exists
- [ ] No other `fileHash` related indexes exist
- [ ] Server starts without errors
- [ ] Upload works without duplicate key errors
- [ ] Verification works correctly

## Expected Final Indexes

After cleanup, you should see:

```
- _id_ (default MongoDB index)
- hash_1 (unique index on hash field)
```

## Testing

1. **Test Upload:**
   - Upload a new certificate
   - Should succeed without duplicate key error

2. **Test Duplicate:**
   - Upload the same file twice
   - Second upload should fail with "Certificate already registered" (not duplicate key error)

3. **Test Verification:**
   - Verify an uploaded certificate
   - Should return VERIFIED status

## Notes

- The cleanup script is safe to run multiple times
- It will not delete data, only indexes
- Mongoose will automatically create the `hash_1` index if it doesn't exist (due to `unique: true` in schema)
- If you see errors, check your `MONGODB_URI` in `.env` file

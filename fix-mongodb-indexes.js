require("dotenv").config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

async function fixIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('certificates');

        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n🗑️  Removing stale indexes...');

        const indexNames = indexes.map(idx => idx.name);
        
        // Find all indexes that reference fileHash (in case of variations)
        const fileHashIndexes = indexes.filter(idx => {
            const keys = Object.keys(idx.key || {});
            return keys.includes('fileHash') || idx.name.includes('fileHash');
        });

        if (fileHashIndexes.length > 0) {
            console.log(`📋 Found ${fileHashIndexes.length} stale fileHash index(es):`);
            fileHashIndexes.forEach(idx => {
                console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            });
        }

        // Drop all fileHash-related indexes
        for (const idx of fileHashIndexes) {
            try {
                await collection.dropIndex(idx.name);
                console.log(`✅ Dropped stale index: ${idx.name}`);
            } catch (err) {
                if (err.code === 27 || err.codeName === 'IndexNotFound') {
                    console.log(`ℹ️  Index ${idx.name} does not exist (already removed)`);
                } else {
                    console.error(`❌ Error dropping ${idx.name}:`, err.message);
                }
            }
        }

        // Also try common index name patterns
        const commonFileHashIndexNames = ['fileHash_1', 'fileHash_1_1', 'fileHash_-1'];
        for (const indexName of commonFileHashIndexNames) {
            if (indexNames.includes(indexName)) {
                try {
                    await collection.dropIndex(indexName);
                    console.log(`✅ Dropped stale index: ${indexName}`);
                } catch (err) {
                    if (err.code === 27 || err.codeName === 'IndexNotFound') {
                        console.log(`ℹ️  Index ${indexName} does not exist (already removed)`);
                    } else {
                        console.error(`❌ Error dropping ${indexName}:`, err.message);
                    }
                }
            }
        }
        
        if (fileHashIndexes.length === 0 && !commonFileHashIndexNames.some(name => indexNames.includes(name))) {
            console.log('ℹ️  No fileHash indexes found (already cleaned up)');
        }

        console.log('\n✅ Ensuring hash index exists...');
        
        const hashIndexExists = indexes.some(idx => 
            idx.name === 'hash_1' || 
            (idx.key && idx.key.hash === 1)
        );

        if (!hashIndexExists) {
            await collection.createIndex({ hash: 1 }, { unique: true, name: 'hash_1' });
            console.log('✅ Created unique index on hash field');
        } else {
            console.log('✅ Unique index on hash already exists');
        }

        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(idx => {
            const isUnique = idx.unique ? ' (UNIQUE)' : '';
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${isUnique}`);
        });

        console.log('\n✅ Index cleanup complete!');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixIndexes();

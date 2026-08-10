const { Task } = require('./models/user_db');
const { sendEvent } = require('./sse'); // SSE broadcaster

let taskStream = null;

try {
  // Monitor the 'tasks' collection for any changes
  taskStream = Task.watch([], { fullDocument: 'updateLookup' });

  taskStream.on('change', (change) => {
    // We only care about inserts and updates for notifications
    if (['insert', 'update', 'replace'].includes(change.operationType)) {
      const notification = {
        type: change.operationType,
        collection: 'tasks',
        documentId: change.documentKey._id,
        data: change.fullDocument,
        updateDescription: change.updateDescription,
        timestamp: new Date().toISOString()
      };

      console.log(`🔔 Task change detected: ${change.operationType}`);
      sendEvent(notification);
    }
  });

  taskStream.on('error', (err) => {
    // Handle standalone local MongoDB case gracefully instead of crashing
    if (err.code === 40573 || err.codeName === 'Location40573' || err.message.includes('replica sets')) {
      console.warn('⚠️ Local MongoDB standalone detected. Task Change Streams (watch) disabled (requires a MongoDB Replica Set).');
    } else {
      console.error('❌ Task Change Stream Error:', err);
    }
  });

  console.log('📡 MongoDB Change Stream listener running for tasks');

} catch (err) {
  console.warn('⚠️ Could not initialize Task Change Stream:', err.message);
}

module.exports = taskStream;

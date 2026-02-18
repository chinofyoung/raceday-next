const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listPendingRegistrations() {
    try {
        const snapshot = await db.collection('registrations')
            .where('status', '==', 'pending')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log('No pending registrations found.');
            return;
        }

        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
        });
    } catch (error) {
        console.error('Error listing registrations:', error);
    }
}

listPendingRegistrations();

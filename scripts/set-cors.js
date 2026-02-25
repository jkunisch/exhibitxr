const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load .env.local
dotenv.config({ path: ".env.local" });

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const bucket = admin.storage().bucket();

bucket.setCorsConfiguration([
    {
        origin: ["*"],
        method: ["GET", "HEAD"],
        maxAgeSeconds: 3600,
    },
]).then(() => {
    console.log("✅ CORS configuration set successfully for bucket:", bucket.name);
    process.exit(0);
}).catch((error) => {
    console.error("❌ Error setting CORS:", error);
    process.exit(1);
});

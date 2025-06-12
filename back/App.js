// === Import required modules ===
import express from "express";
const app = express();
import { RateLimiterMemory } from 'rate-limiter-flexible';
import multer from "multer";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();
import cors from "cors";
import helmet from 'helmet';
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
//import morgan from 'morgan';
import fs from "fs";
//import { db } from "./firebaseConfig"; // Firebase Firestore initialization (assuming it's set up)
//the service account for firebase and const admin = require('firebase-admin'); represent line  9
import listEndpoints from 'express-list-endpoints';//the listing of all routes working in my code 
//import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import twilio from 'twilio';
//import path from 'path';
// dotenv.config(); // already called above
// Initialize Firebase Admin SDK
//course
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
const stripe = Stripe("sk_test_YOUR_SECRET_KEY"); // replace with real key

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Firestore database reference
app.use(cors);




const port = process.env.PORT || 5000;
// === Middleware Setup ===

app.use(express.json());
app.use(express.static("public"));
//app.use(morgan('combined'));  // Logs incoming requests
//const helmet = require('helmet');
//app.use(helmet());//protection over cross-site scripting



// Index route
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});


app.get('/test-error', (req, res) => {
  throw new Error('Test error');
});
//production code
/*if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });
}


app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});


// app to restart instances if they become unhealthy
app.get('/health', (req, res) => {
  res.status(200).send('OK');
})

*/


console.log("Service Account Credentials:", serviceAccount);
// === Google Cloud Storage Setup ===
const storage = new Storage({
  keyFilename: path.join(__dirname, process.env.GOOGLE_KEY_FILE),
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);
// === Multer Setup === limit of sizes of videos
const upload = multer({
  dest: "uploads/",
 limits: { fileSize: 700 * 1024 * 1024 }, // 700 MB
});

// === Upload Video Endpoint ===
app.post("/upload-video", upload.single("videoFile"), async (req, res) => {
  console.log("📥 Upload request received at /upload-video");

  try {
    if (!req.file) {
      console.warn("⚠️ No file found in request");
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const videoId = uuidv4(); // Generate a unique video ID
    const gcsFilename = `${videoId}-${req.file.originalname}`;
    console.log(`🆔 Generated Video ID: ${videoId}`);
    console.log(`📄 GCS target filename: ${gcsFilename}`);

    const blob = bucket.file(gcsFilename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("❌ GCS Upload Error:", err);
      res.status(500).json({ success: false, message: "Upload failed to gcs" });
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      console.log(`✅ File uploaded to GCS: ${publicUrl}`);

      const video = {
        id: videoId,
        title: req.file.originalname,
        path: publicUrl,
      };

      try {
        // Save video metadata to Firestore
        await db.collection("videos").doc(videoId).set(video);
        console.log(`🗂️ Metadata saved to Firestore for video ID: ${videoId}`);
      } catch (firestoreErr) {
        console.error("🔥 Firestore save error:", firestoreErr);
        return res.status(500).json({ success: false, message: "Failed to save metadata" });
      }

      // Delete local file from uploads folder
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.warn(`⚠️ Failed to delete local file: ${req.file.path}`, unlinkErr);
        } else {
          console.log(`🧹 Local file deleted: ${req.file.path}`);
        }
      });

      res.status(200).json({ success: true, path: publicUrl, video });
    });

    // Using fs.createReadStream to stream the file to GCS instead of reading it all at once
    const fileStream = fs.createReadStream(req.file.path);
    fileStream.pipe(blobStream); // Pipe the file stream to GCS blob stream
    console.log("📤 Streaming file to GCS...");

  } catch (err) {
    console.error("💥 Server Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});








/// === Get All Videos Endpoint ===
app.get("/all-videos", async (req, res) => {
  console.log("📥 GET /all-videos called");

  try {
    const page = parseInt(req.query.page) || 1; // Current page number (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Number of videos per page (default: 10)
    const startAt = (page - 1) * limit;

    console.log(`📄 Pagination => Page: ${page}, Limit: ${limit}, StartAt: ${startAt}`);

    const snapshot = await db.collection("videos")
      .orderBy("id")
      .offset(startAt)
      .limit(limit)
      .get();

    const videos = snapshot.docs.map(doc => doc.data());

    console.log(`✅ Fetched ${videos.length} videos`);
    res.status(200).json(videos);
  } catch (err) {
    console.error("❌ Error fetching videos:", err);
    res.status(500).json({ success: false, message: "Error fetching videos" });
  }
});

// === Get Liked Videos for a User ===
app.get("/user/:userId/liked-videos", async (req, res) => {
  const userId = req.params.userId;
  console.log(`📥 GET /user/${userId}/liked-videos called`);

  try {
    const likesRef = db.collection("likes").doc(userId);
    const doc = await likesRef.get();

    if (!doc.exists) {
      console.log("ℹ️ No liked videos found for user");
      return res.status(200).json({ success: true, likedVideos: [] });
    }

    const likedVideoIds = doc.data().videoIds || [];
    console.log(`🎯 Found ${likedVideoIds.length} liked video IDs`);

    // Fetch liked videos from Firestore
    const likedVideos = [];
    for (const id of likedVideoIds) {
      const videoDoc = await db.collection("videos").doc(id).get();
      if (videoDoc.exists) {
        likedVideos.push(videoDoc.data());
        console.log(`✅ Retrieved video data for ID: ${id}`);
      } else {
        console.warn(`⚠️ Video ID ${id} not found in 'videos' collection`);
      }
    }

    res.status(200).json({ success: true, likedVideos });
  } catch (err) {
    console.error("❌ Error fetching liked videos:", err);
    res.status(500).json({ success: false, message: "Error fetching liked videos" });
  }
});

// === Toggle Like/Unlike Video ===
app.post("/user/:userId/like", async (req, res) => {
  const userId = req.params.userId;
  const { videoId } = req.body;

  console.log(`📥 POST /user/${userId}/like called with videoId: ${videoId}`);

  if (!videoId) {
    console.warn("⚠️ Missing videoId in request body");
    return res.status(400).json({ success: false, message: "Missing videoId" });
  }

  try {
    const likesRef = db.collection("likes").doc(userId);
    const doc = await likesRef.get();

    let likedVideoIds = [];
    if (doc.exists) {
      likedVideoIds = doc.data().videoIds || [];
    }

    let liked;
    if (likedVideoIds.includes(videoId)) {
      // Unlike
      likedVideoIds = likedVideoIds.filter(id => id !== videoId);
      liked = false;
      console.log(`👎 Unliked video: ${videoId}`);
    } else {
      // Like
      likedVideoIds.push(videoId);
      liked = true;
      console.log(`👍 Liked video: ${videoId}`);
    }

    await likesRef.set({ videoIds: likedVideoIds });
    console.log(`🔁 Updated likes for user ${userId}: ${likedVideoIds.length} videos liked`);

    res.status(200).json({ success: true, liked });
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    res.status(500).json({ success: false, message: "Error toggling like" });
  }
});

// === Get Watch History (Paginated) ===
app.get("/user/:userId/history", async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const pageSize = 10; // Number of videos per page
  const offset = (page - 1) * pageSize;

  console.log(`📥 GET /user/${userId}/history - Page: ${page}, Offset: ${offset}`);

  try {
    const historyRef = db.collection('history').doc(userId);
    const doc = await historyRef.get();

    if (!doc.exists) {
      console.warn(`⚠️ No history found for user ${userId}`);
      return res.status(404).json({ success: false, message: 'No history found for this user.' });
    }

    const history = doc.data().watchedVideos || [];
    console.log(`📚 Found ${history.length} history entries for user ${userId}`);

    const paginatedVideos = history.slice(offset, offset + pageSize);

    const watchedVideos = [];
    for (const item of paginatedVideos) {
      const videoDoc = await db.collection("videos").doc(item.videoId).get();
      if (videoDoc.exists) {
        watchedVideos.push(videoDoc.data());
        console.log(`✅ Retrieved video data for ID: ${item.videoId}`);
      } else {
        console.warn(`⚠️ Video ID ${item.videoId} not found in videos collection`);
      }
    }

    res.status(200).json({ success: true, watchedVideos });
  } catch (err) {
    console.error("❌ Error fetching watched videos:", err);
    res.status(500).json({ success: false, message: 'Error fetching watched videos' });
  }
});

// === Document Upload & Watch Log Endpoint ===
app.post("/user/:userId/watch", async (req, res) => {
  const userId = req.params.userId;
  const { videoId } = req.body;

  console.log(`📥 POST /user/${userId}/watch - Video ID: ${videoId}`);

  if (!videoId) {
    console.warn("⚠️ Missing videoId in request body");
    return res.status(400).json({ success: false, message: "Missing videoId" });
  }

  try {
    const historyRef = db.collection('history').doc(userId);
    const historyDoc = await historyRef.get();

    if (!historyDoc.exists) {
      console.log(`🆕 Creating new history for user ${userId}`);
      await historyRef.set({
        watchedVideos: [{ videoId, watchedAt: new Date() }],
      });
    } else {
      const historyData = historyDoc.data();
      historyData.watchedVideos.push({ videoId, watchedAt: new Date() });
      await historyRef.update({ watchedVideos: historyData.watchedVideos });
      console.log(`📌 Updated watch history for user ${userId}, total: ${historyData.watchedVideos.length}`);
    }

    res.status(200).json({ success: true, message: 'Watch log updated' });
  } catch (err) {
    console.error("❌ Error logging video watch:", err);
    res.status(500).json({ success: false, message: 'Error logging video watch' });
  }
});

// === Add a route to delete a history item ===
app.delete('/api/history/:userId/:videoId', async (req, res) => {
  const { userId, videoId } = req.params;

  console.log(`🗑️ DELETE /api/history/${userId}/${videoId}`);

  try {
    const historyRef = db.collection('history').doc(userId);
    const historyDoc = await historyRef.get();

    if (!historyDoc.exists) {
      console.warn(`⚠️ User history not found for ${userId}`);
      return res.status(404).json({ success: false, message: 'User history not found' });
    }

    const historyData = historyDoc.data();
    const updatedHistory = historyData.watchedVideos.filter(item => item.videoId !== videoId);

    await historyRef.update({
      watchedVideos: updatedHistory
    });

    console.log(`✅ History item with videoId ${videoId} deleted for user ${userId}`);
    res.status(200).json({ success: true, message: 'History item deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting history item:", err);
    res.status(500).json({ success: false, message: 'Error deleting history item' });
  }
});

// === Add a route to mark a history item as watched/unwatched ===
app.patch('/api/history/:userId/:videoId/mark', async (req, res) => {
  const { userId, videoId } = req.params;
  const { status } = req.body; // expected status is either "watched" or "unwatched"

  console.log(`📝 PATCH /api/history/${userId}/${videoId}/mark - Status: ${status}`);

  try {
    if (status !== 'watched' && status !== 'unwatched') {
      console.warn("⚠️ Invalid status provided:", status);
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const historyRef = db.collection('history').doc(userId);
    const historyDoc = await historyRef.get();

    if (!historyDoc.exists) {
      console.warn(`⚠️ User history not found for ${userId}`);
      return res.status(404).json({ success: false, message: 'User history not found' });
    }

    const historyData = historyDoc.data();
    const updatedHistory = historyData.watchedVideos.map(item =>
      item.videoId === videoId ? { ...item, status } : item
    );

    await historyRef.update({
      watchedVideos: updatedHistory
    });

    console.log(`✅ Video ID ${videoId} marked as ${status} for user ${userId}`);
    res.status(200).json({ success: true, message: `Video marked as ${status}` });
  } catch (err) {
    console.error("❌ Error updating history:", err);
    res.status(500).json({ success: false, message: 'Error updating history' });
  }
});

// === Documentaries Endpoint with Pagination & Firestore-level Filtering ===
app.get("/documentaries", async (req, res) => {
  // Parse pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  console.log(`📥 GET /documentaries - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

  try {
    // Query videos where 'documentary' is a tag
    const query = db.collection("videos")
      .where("tags", "array-contains", "documentary")
      .orderBy("createdAt", "desc") // Optional: ensure consistent pagination
      .offset(offset) // Skip N items
      .limit(limit);  // Limit the number of results

    const snapshot = await query.get();
    console.log(`📚 Retrieved ${snapshot.size} documentaries from Firestore`);

    // Map document data
    const documentaries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Send response
    res.status(200).json(documentaries);
  } catch (err) {
    console.error("❌ Error fetching documentaries:", err);
    res.status(500).json({ success: false, message: 'Error fetching documentaries' });
  }
});



//authentication




const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Twilio setup

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ Middleware to verify JWT token and attach user data
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>" used for authentication

  if (!token) {
    console.warn('⚠️ Access token missing');
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('⚠️ Invalid or expired token');
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    console.log('✅ JWT verified for user:', user.username);
    req.user = user; // Attach user info to request object
    next(); // Proceed to route
  });
}

// ✅ Send verification code (Twilio)
async function sendVerificationCode(destination, code) {
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: destination
    });
    console.log(`📨 Send verification code: ${code} to ${destination} | SID: ${message.sid}`);
  } catch (error) {
    console.error('❌ Failed to send verification code via Twilio:', error.message);
  }
}

// ✅ POST /signup
app.post('/api/signup', async (req, res) => {
  const { username, password, email, phone } = req.body; // Includes both email and phone
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random verification code

  if (!username || !password || !email || !phone) {
    console.warn('⚠️ Signup failed - Missing required fields');
    return res.status(400).json({ success: false, message: 'Username, password, email, and phone are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('⚠️ Invalid email format:', email);
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  if (!phoneRegex.test(phone)) {
    console.warn('⚠️ Invalid phone number format:', phone);
    return res.status(400).json({ success: false, message: 'Invalid phone number format' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = db.collection('users');
    const snapshot = await userRef.where('username', '==', username).get();

    if (!snapshot.empty) {
      console.warn('⚠️ Username already exists:', username);
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const user = {
      username,
      password: hashedPassword,
      email,          // Store email
      phone,          // Store phone separately
      contact: phone, // Still using 'contact' as the field name for SMS consistency
      code
    };
    const userDoc = await userRef.add(user);
    console.log('✅ User signed up:', username);

    sendVerificationCode(phone, code); // Send verification code via SMS (Twilio)

    const token = jwt.sign({ userId: userDoc.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'Verification code sent.', token });
  } catch (err) {
    console.error('❌ Signup failed:', err);
    res.status(500).json({ success: false, message: 'Signup failed.' });
  }
});
// ✅ POST /login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    console.warn('⚠️ Login failed - Missing credentials');
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const userRef = db.collection('users');
    const snapshot = await userRef.where('username', '==', username).get();

    if (snapshot.empty) {
      console.warn('⚠️ User not found during login:', username);
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const user = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn('⚠️ Invalid credentials for user:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: snapshot.docs[0].id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ User logged in:', username);

    res.json({ success: true, token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Login error' });
  }
});
// ✅ POST /forgot-password
app.post('/api/forgotpassword', async (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random reset code

  if (!phone) {
    console.warn('⚠️ Forgot password - Phone number required');
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  if (!phoneRegex.test(phone)) {
    console.warn('⚠️ Forgot password - Invalid phone number format:', phone);
    return res.status(400).json({ success: false, message: 'Invalid phone number format' });
  }

  try {
    const userRef = db.collection('users');
    const snapshot = await userRef.where('contact', '==', phone).get();

    if (snapshot.empty) {
      console.warn('⚠️ Forgot password - User not found:', phone);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ code });
    console.log(`✅ Reset code updated for user: ${phone}`);

    sendVerificationCode(phone, code); // Now sending via SMS (Twilio)
    res.json({ success: true, message: 'Verification code sent via SMS.' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Error sending code' });
  }
});
//testing firebase
app.get('/test-firestore', async (req, res) => {
  try {
    await db.collection('testCollection').add({ timestamp: Date.now() });
    console.log('✅ Firestore test write successful');
    res.send('Successfully wrote to Firestore!');
  } catch (err) {
    console.error('❌ Firestore test write failed:', err);
    res.status(500).send('Error writing to Firestore');
  }
});







//age
// Rate limiting: 10 requests per hour per IP
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 60, // 1 hour
});

// Middleware for rate limiting
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  rateLimiter.consume(ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
    });
};

// Apply rate limiting middleware to the /age-transform route
app.use('/age-transform', rateLimitMiddleware);

// POST endpoint to receive image + ageOffset

// POST endpoint to receive image + ageOffset
app.post('/age-transform', upload.single('image'), async (req, res) => {
  const { file } = req;
  const { ageOffset } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  console.log(`Received image: ${file.filename}, Age Offset: ${ageOffset}`);

  try {
    // Create FormData for Photor API
    const formData = new FormData();
    formData.append('image', fs.createReadStream(file.path));
    formData.append('ageOffset', ageOffset);

    const response = await axios.post('https://api.photor.ai/age-transform', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.PHOTOR_API_KEY}`,
      },
    });

    const transformedImageUrl = response.data.url;

    // Optionally clean up the uploaded file locally
    setTimeout(() => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
        else console.log(`Deleted local file: ${file.filename}`);
      });
    }, 6 * 60 * 60 * 1000); // 6 hours

    res.json({ transformedImageUrl });

  } catch (err) {
    console.error('Photor API error:', err);
    res.status(500).json({ error: 'Failed to process image with Photor API.' });
  }
});






//cousepage 
//the consent page 

// Endpoint to create Stripe customer
app.post("/api/create-customer", async (req, res) => {
  const { email, orgName } = req.body;

  try {
    const customer = await stripe.customers.create({
      email,
      name: orgName,
    });
    res.json({ customerId: customer.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save consent agreement
app.post("/api/submit-consent", async (req, res) => {
  const { organizationId, customerId, agreed, email } = req.body;

  if (!agreed) {
    return res.status(400).send("Consent required.");
  }

  if (!organizationId || !customerId || !email) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    await db.collection('organizationConsents').doc(organizationId).set({
      customerId,
      agreedBy: email, // ← This line added
      agreedAt: admin.firestore.FieldValue.serverTimestamp(),
      terms: {
        revenueShare: 0.3,
        perClickFee: 0.5,
        liveMinuteFee: 0.25,
      },
    });

    res.status(200).send("Consent recorded.");
  } catch (error) {
    console.error("Error saving consent:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Save organization profile + ad data
app.post("/api/save-organization-profile", async (req, res) => {
  const {
    organizationId,
    organizationName,
    website,
    email,
    about,
    achievements,
    uniqueness,
    courses,
    adData,
  } = req.body;

  // 🔒 Basic validation
  if (!organizationId || !organizationName || !email || !website || !about) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 📦 Data to be saved
    const data = {
      organizationName,
      website,
      email,
      about,
      achievements,
      uniqueness,
      courses, // array of course objects with timetable, price, etc.
      adPreferences: {
        wantsToAdvertise: adData?.wantsToAdvertise || false,
        adText: adData?.adText || "",
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 🧾 Save to Firestore using organizationId as the document ID
    await db.collection("organizationProfiles").doc(organizationId).set(data);

    res.status(200).json({ message: "Profile saved successfully" });
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// organization corses
app.get('/api/organization/:orgId/courses', async (req, res) => {
  const { orgId } = req.params;
  try {
    const courses = await getCoursesByOrganizationId(orgId); // Your DB call
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});



// 🔍 Check if organization profile exists
app.get("/api/check-organization-profile/:organizationId", async (req, res) => {
  const { organizationId } = req.params;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Verify decoded.orgId === organizationId if included in JWT
    const doc = await db.collection("organizationProfiles").doc(organizationId).get();

    return res.json({ exists: doc.exists });
  } catch (err) {
    console.error("JWT validation failed", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});






const impressionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // limit each IP to 30 requests per minute
  message: "Too many impressions from this IP, try again later."
});

// Get ads for a specific placement (e.g., homepage)
// Get all ads that want to advertise, ignoring placement
app.get("/api/get-ads", async (req, res) => {
  const adsSnapshot = await db.collection("Ads")
    .where("wantsToAdvertise", "==", true)
    .get();

  const ads = [];
  adsSnapshot.forEach(doc => {
    ads.push(doc.data());
  });

  res.json(ads);
});

// POST /api/track-ad-view
app.post("/track-ad-view", async (req, res) => {
  const { organizationId } = req.body;
  const now = admin.firestore.Timestamp.now();

  // Add an impression log with timestamp
  await db.collection("AdImpressions")
    .doc(organizationId)
    .collection("ViewLogs")
    .add({ viewedAt: now });

  // Get total views count (could be incremented separately for efficiency)
  const impressionsDoc = db.collection("AdImpressions").doc(organizationId);
  const doc = await impressionsDoc.get();

  if (!doc.exists) {
    await impressionsDoc.set({ views: 1 });
  } else {
    const data = doc.data();
    const newViews = data.views + 1;
    await impressionsDoc.update({ views: newViews });

    // Charge every 1000 views
    if (newViews % 1000 === 0) {
      // Charge via Stripe (or your payment method)
      await chargeOrganizationCard(organizationId, 3000);

      // Log payment in Payments collection
      await db.collection("Payments").add({
        organizationId,
        amount: 3000,      // in cents ($30)
        paidAt: now,
        status: "paid",
      });
    }
  }

  res.status(200).send("View counted and logged");
});




app.post("/api/attach-payment-method", async (req, res) => {
  const { customerId, paymentMethodId } = req.body;
  try {
    // Attach to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to attach payment method");
  }
});


app.get("/api/organization/:orgId", async (req, res) => {
  const orgId = req.params.orgId;

  try {
    // Assuming your organizations are stored in a collection called 'organizations'
    const orgDoc = await db.collection("organizationsProfiles").doc(orgId).get();

    if (!orgDoc.exists) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Send back organization data
    res.json(orgDoc.data());
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});







//organization courses 
app.get('/api/organizations/:organizationId/courses', async (req, res) => {
  const { organizationId } = req.params;
  try {
    const orgRef = db.collection('OrganizationsProfiles').doc(organizationId);
    const coursesSnapshot = await orgRef.collection('courses').get();
    if (coursesSnapshot.empty) {
      return res.status(404).send('No courses found');
    }
    const courses = coursesSnapshot.docs.map(doc => doc.data());
    res.json(courses);
  } catch (err) {
    res.status(500).send('Error fetching courses');
  }
});
//studentstimetable page 
app.get('/api/course/:organizationId/:courseId', async (req, res) => {
  const { organizationId, courseId } = req.params;
  try {
    const orgDoc = await db.collection('organizationProfiles').doc(organizationId).get();

    if (!orgDoc.exists) {
      return res.status(404).send('Organization not found');
    }

    const courses = orgDoc.data().courses || [];

    const course = courses.find(c => c.id === courseId);

    if (!course) {
      return res.status(404).send('Course not found');
    }

    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching course data');
  }
});




//student buy the course
app.post('/create-checkout-session', async (req, res) => {
  const { price, courseTitle, orgId, courseId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: courseTitle,
          },
          unit_amount: price * 100, // in cents
        },
        quantity: 1,
      }],
      mode: 'payment',

      // 💡 Important: Include metadata to identify course + user in webhook or session retrieval
      metadata: {
        orgId,
        courseId,
        userId,
      },

      success_url: `${process.env.FRONTEND_URL}/organization/${orgId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/organization/${orgId}?cancel=true`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: "Failed to create Stripe session" });
  }
});




// Example: POST /api/notify-class-change
app.post("/api/notify-class-change", async (req, res) => {
  const { organizationId, courseId, lessonIndex, notice } = req.body;

  try {
    const courseRef = db.collection("courses").doc(courseId);
    const doc = await courseRef.get();

    if (!doc.exists) return res.status(404).send("Course not found");

    const program = doc.data().timetable || [];
    if (!program[lessonIndex]) return res.status(400).send("Invalid lesson index");

    program[lessonIndex].notice = notice;

    await courseRef.update({ timetable: program });

    res.status(200).send("Notice updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
 



app.get("/api/get-organizations", async (req, res) => {
  try {
    const snapshot = await db.collection("organizationProfiles").get(); // Use same collection everywhere

    const orgs = snapshot.docs.map((doc) => doc.data());
    res.json(orgs);
  } catch (err) {
    res.status(500).send("Error fetching organizations: " + err.message);
  }
});




app.post("/api/purchase-course", async (req, res) => {
  const { userId, courseId, organizationId, amountPaid } = req.body;

  const platformShare = amountPaid * 0.3;
  const orgEarnings = amountPaid - platformShare;

  try {
    await db.collection("CoursePurchases").add({
      userId,
      courseId,
      organizationId,
      amountPaid,
      platformShare,
      orgEarnings,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("Purchase recorded and 30% platform share saved.");
  } catch (err) {
    res.status(500).send("Error recording purchase: " + err.message);
  }
});

app.post("/api/verify-purchase", async (req, res) => {
  const { sessionId } = req.body;

  try {
    // Verify session with Stripe (if needed)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const courseId = session.metadata.courseId;       // assuming you passed this when creating the session
    const organizationId = session.metadata.organizationId;

    // Fetch course info from Firestore
    const orgDoc = await db.collection("organizationProfiles").doc(organizationId).get();
    const courses = orgDoc.data().courses || [];

    const purchasedCourse = courses.find(course => course.id === courseId);
    if (!purchasedCourse) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Optionally, log the purchase (or you already did it elsewhere)
    res.status(200).json({
      success: true,
      purchasedCourse: {
        title: purchasedCourse.title,
        type: purchasedCourse.type,
      },
    });
  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({ success: false, error: "Verification error" });
  }
});


app.post("/api/interest-click", async (req, res) => {
  const { userId, organizationId } = req.body;

  try {
    await db.collection("OrganizationClicks").add({
      userId,
      organizationId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("Click logged for $0.50 payout.");
  } catch (err) {
    res.status(500).send("Error logging click: " + err.message);
  }
});



// Fetch course data (courseId assumed to be defined)
// ✅ Corrected code
// Assuming app is your Express instance

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { courseId, organizationId } = req.body;  // ✅ values sent from frontend

    if (!courseId || !organizationId) {
      return res.status(400).json({ error: 'Missing courseId or organizationId' });
    }

    // Fetch course and organization data
    const orgDoc = await db.collection('organizationProfiles').doc(organizationId).get();
    if (!orgDoc.exists) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgData = orgDoc.data();
    const coursePriceDollars = orgData.price;
    const amountInCents = Math.round(coursePriceDollars * 100);
    const orgAmountInCents = Math.round(amountInCents * 0.7);

    // Get Stripe account ID from consentform
    const consentFormDoc = await db.collection('consentform').doc(organizationId).get();
    if (!consentFormDoc.exists) {
      return res.status(404).json({ error: 'Consent form not found' });
    }

    const connectedAccountId = consentFormDoc.data().customerId;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_data: {
        destination: connectedAccountId,
        amount: orgAmountInCents,
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// In-memory store for payment attempts (replace with a database in production)
// In-memory store for payment attempts (replace with a database in production)
const paymentAttempts = {};

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 1 * 24 * 60 * 60 * 1000; // 1 day


const sendSMS = (to, message) => {
  client.messages
    .create({
      body: message,
      from: fromNumber,
      to: to, // e.g., +2347012345678
    })
    .then((msg) => console.log('📨 SMS sent:', msg.sid))
    .catch((err) => console.error('❌ SMS error:', err.message));
};

// Handle Stripe webhook events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const organizationId = data.object.customer;

  switch (type) {
    case 'invoice.payment_failed':
      await handleFailedPayment(organizationId);
      break;
    case 'invoice.payment_succeeded':
      await resetPaymentStatus(organizationId);
      break;
    default:
      console.log(`Unhandled event type ${type}`);
  }

  res.status(200).send();
});

// 🔁 Handle failed payment attempts and update Firestore
const handleFailedPayment = async (organizationId) => {
  const orgRef = db.collection("organizationProfiles").doc(organizationId);
  const doc = await orgRef.get();

  if (!doc.exists) {
    console.error("Organization not found:", organizationId);
    return;
  }

  const currentData = doc.data();
  const attempts = currentData.failedAttempts || 0;
  const lastAttempt = currentData.lastAttempt || 0;

  const now = Date.now();
  if (now - lastAttempt < RETRY_INTERVAL) {
    console.log("⏱️ Retry interval not yet passed");
    return;
  }

  const newAttempts = attempts + 1;

  if (newAttempts >= MAX_RETRIES) {
    await orgRef.update({
      failedAttempts: newAttempts,
      status: "disabled",
      lastAttempt: now,
    });
    sendSMS(currentData.phoneNumber, "🚫 Your LanVai account has been disabled due to multiple failed payments.");
  } else {
    await orgRef.update({
      failedAttempts: newAttempts,
      lastAttempt: now,
    });
    sendSMS(currentData.phoneNumber, `⚠️ Payment failed (Attempt ${newAttempts}). Please update your billing info.`);
  }
};

// ✅ Reset payment status after successful payment
const resetPaymentStatus = async (organizationId) => {
  const orgRef = db.collection("organizationProfiles").doc(organizationId);
  const doc = await orgRef.get();

  if (!doc.exists) {
    console.error("Organization not found:", organizationId);
    return;
  }

  await orgRef.update({
    failedAttempts: 0,
    status: "active",
    lastAttempt: Date.now(),
  });
};





//meetings 
const APP_ID = process.env.REACT_APP_AGORA_APP_ID;
const APP_CERTIFICATE = process.env.REACT_APP_AGORA_APP_CERTIFICATE;

// In-memory polls store
const polls = {}; // { pollId: { question, options, votes: {optionIndex: count} } }

// Generate Agora RTC token
app.get('/api/token', (req, res) => {
  const channelName = req.query.channelName;
  if (!channelName) return res.status(400).json({ error: 'channelName is required' });

  const uid = 0; // 0 means generate token with user account
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpiredTs);

  res.json({ token });
});

// Create a poll
app.post('/api/polls', (req, res) => {
  const { pollId, question, options } = req.body;
  if (!pollId || !question || !options || !Array.isArray(options)) {
    return res.status(400).json({ error: 'pollId, question, and options (array) required' });
  }

  polls[pollId] = {
    question,
    options,
    votes: options.reduce((acc, _, idx) => {
      acc[idx] = 0;
      return acc;
    }, {})
  };
  res.json({ success: true });
});

// Vote on a poll option
app.post('/api/polls/:pollId/vote', (req, res) => {
  const { pollId } = req.params;
  const { optionIndex } = req.body;
  if (!polls[pollId]) return res.status(404).json({ error: 'Poll not found' });

  if (optionIndex === undefined || !polls[pollId].votes.hasOwnProperty(optionIndex)) {
    return res.status(400).json({ error: 'Invalid option index' });
  }

  polls[pollId].votes[optionIndex]++;
  res.json({ success: true, votes: polls[pollId].votes });
});

// Get poll results
app.get('/api/polls/:pollId', (req, res) => {
  const { pollId } = req.params;
  if (!polls[pollId]) return res.status(404).json({ error: 'Poll not found' });

  res.json(polls[pollId]);
});








//couse programme
// Firebase Admin Initialization with env vars

// Endpoint to start class to track if the class has started then the start lesson button then enables 
app.post('/api/class/start', async (req, res) => {
  const { courseId, lessonIndex } = req.body;
  try {
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const program = courseDoc.data().program;
    if (program[lessonIndex]) {
      program[lessonIndex].classStarted = true;
      await courseRef.update({ program });
      res.status(200).json({ message: 'Class started' });
    } else {
      res.status(400).json({ message: 'Invalid lesson index' });
    }
  } catch (error) {
    console.error('Error starting class:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



//student access paid courses directly
app.get("/api/purchased-course-details/:courseId", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Now check if user has purchased the course
    const userDoc = await db.collection("CoursePurchases").doc(userId).get();
    const purchasedCourses = userDoc.data()?.purchasedCourses || [];

    const courseId = req.params.courseId;
    const purchased = purchasedCourses.find(c => c.courseId === courseId);

    if (!purchased) {
      return res.status(403).json({ error: "Access denied: Course not purchased" });
    }

    return res.json({
      courseType: purchased.type,
      organizationId: purchased.organizationId,
    });
  } catch (err) {
    console.error("Invalid or expired token", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
});




app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});






app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
  console.log('Registered Routes:');
  console.log(listEndpoints(app));
}).on('error', (err) => {
  console.error('❌ Server failed:', err);
});
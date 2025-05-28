// === Import required modules ===

const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
require('dotenv').config();
const cors = require("cors");
const helmet = require('helmet');
const { Storage } = require("@google-cloud/storage");
const { v4: uuidv4 } = require("uuid");
//const morgan = require('morgan');
const fs = require("fs");
//const { db } = require("./firebaseConfig"); // Firebase Firestore initialization (assuming it's set up)
//the service account for firebase and const admin = require('firebase-admin'); represent line  9
const listEndpoints = require('express-list-endpoints');//the listing of all routes working in my code 
//const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
//const path = require('path');
require('dotenv').config();
// Initialize Firebase Admin SDK

app.use(cors());
app.use(bodyParser.json());



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

const serviceAccount = require(path.join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Firestore database reference

const JWT_SECRET = process.env.JWT_SECRET;

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

// ✅ Send verification code (mock)
function sendVerificationCode(destination, code) {
  console.log(`📨 Send verification code: ${code} to ${destination}`); // Replace with actual email/SMS sending (Twilio, SendGrid, etc.)
}

// ✅ POST /signup
app.post('/api/signup', async (req, res) => {
  const { username, password, email } = req.body; // Changed from phoneOrEmail to email
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random verification code

  if (!username || !password || !email) {
    console.warn('⚠️ Signup failed - Missing required fields');
    return res.status(400).json({ success: false, message: 'Username, password, and email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('⚠️ Invalid email format:', email);
    return res.status(400).json({ success: false, message: 'Invalid email format' });
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
      contact: email, // Still using 'contact' as the field name for consistency
      code
    };
    const userDoc = await userRef.add(user);
    console.log('✅ User signed up:', username);

    sendVerificationCode(email, code); // Send verification code

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
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random reset code

  if (!email) {
    console.warn('⚠️ Forgot password - Email required');
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('⚠️ Forgot password - Invalid email format:', email);
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  try {
    const userRef = db.collection('users');
    const snapshot = await userRef.where('contact', '==', email).get();

    if (snapshot.empty) {
      console.warn('⚠️ Forgot password - User not found:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ code });
    console.log(`✅ Reset code updated for user: ${email}`);

    sendVerificationCode(email, code);
    res.json({ success: true, message: 'Verification code sent to email.' });
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





// List all routes using the express-list-endpoints package
console.log(listEndpoints(app));



// === Start Server ===
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import threading, time, os, requests, logging
from datetime import datetime, timedelta
from PIL import ImageDraw, ImageFont, Image
import io
import uuid
import openai
from openai import OpenAI
import  fitz  #PyMuPDF

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)  # Enable CORS globally to allow cross-origin requests from frontend

# Root route to verify server is running
@app.route('/', methods=['GET'])
def index():
    return 'Server is running'

# Set OpenAI API key
openai.api_key = os.getenv ("OPENAI_API_KEY")
client = OpenAI(api_key=openai.api_key)

# Directories for storing uploaded files
UPLOAD_FOLDER = 'uploads'
USERDOC_FOLDER = 'userdocs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(USERDOC_FOLDER, exist_ok=True)

# Dictionary to keep track of reasoning for each answer
reasoning_store = {}

# Utility: delete a file after a given delay (used for image cleanup)
def delete_file_later(file_path, delay):
    time.sleep(delay)
    if os.path.exists(file_path):
        os.remove(file_path)
        
        
        
        
    #endpoint to show the user the file that he or she has uploaded for userdata in 24 hours    
@app.route('/get-userdoc', methods=['POST'])
def get_user_doc():
    user_id = request.json.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user_folder = os.path.join(USERDOC_FOLDER, user_id)
    if not os.path.exists(user_folder):
        return jsonify({"file": None})

    pdf_files = [f for f in os.listdir(user_folder) if f.lower().endswith(".pdf")]
    if not pdf_files:
        return jsonify({"file": None})

    # Assuming only one file per user
    return jsonify({"file": pdf_files[0]})      
        
        
        
        
        
        

# Endpoint: Upload user PDF files to be used in AI answers
@app.route('/upload-userdoc', methods=['POST'])
def upload_userdoc():
    file = request.files.get('file')
    user_id = request.form.get('user_id')

    if not file or not user_id:
        return jsonify({'error': 'File or user_id not provided'}), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    user_folder = os.path.join(USERDOC_FOLDER, user_id)
    os.makedirs(user_folder, exist_ok=True)

    file_path = os.path.join(user_folder, filename)
    file.save(file_path)

    # Save upload timestamp for scheduled deletion
    threading.Thread(target=delete_file_later, args=(file_path, 86400)).start()  # Delete after 24h

    return jsonify({'message': f'File {filename} uploaded successfully for user {user_id}.'}), 200
# Helper: Extract text from all user-uploaded PDFs
def extract_text_from_user_pdfs(user_id):
    folder_path = os.path.join(USERDOC_FOLDER, user_id)
    if not os.path.exists(folder_path):
        return ""

    all_text = ""
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(folder_path, filename)
            try:
                with fitz.open(pdf_path) as doc:
                    for page in doc:
                        all_text += page.get_text()
            except Exception as e:
                logging.error(f"Error reading {filename}: {str(e)}")
    return all_text.strip()

# Main AI Endpoint: Accepts image + text and responds with AI-generated answer
@app.route('/ai-image-insight', methods=['POST'])
def analyze():
    try:
        file = request.files.get('image')
        text = request.form.get('text')
        source = request.form.get('source')
        user_id = request.form.get('user_id')

        logging.debug(f"Received file: {file}, text: {text}, source: {source}, user_id: {user_id}")

        if not file and not text:
            logging.error("No image or text provided.")
            return jsonify({'error': 'You must provide at least an image or text.'}), 400

        if source not in ['open', 'userdata']:
            logging.error(f"Invalid source: {source}")
            return jsonify({'error': 'Invalid source type. Choose \"open\" or \"userdata\".'}), 400

        file_path = None
        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            logging.debug(f"Image saved at: {file_path}")
            threading.Thread(target=delete_file_later, args=(file_path, 86400)).start()  # Delete after 24h

        logging.debug(f"Processing text: {text}, source type: {source}")

        if source == 'open':
            if text:
                try:
                    response = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant."},
                            {"role": "user", "content": f"Answer this question: {text}"}
                        ],
                        max_tokens=100
                    )
                    fake_answer = response.choices[0].message.content.strip()
                    logging.debug(f"OpenAI response: {fake_answer}")
                except Exception as e:
                    logging.error(f"OpenAI API error: {str(e)}")
                    fake_answer = "Could not generate answer due to an error."
            else:
                fake_answer = "No text provided for AI to process."
            reasoning = "Answer generated using GPT-3 on publicly available text."

        elif source == 'userdata':
            if not user_id:
                logging.error("user_id is missing for user data source.")
                return jsonify({'error': 'user_id is required for user data source'}), 400

            pdf_text = extract_text_from_user_pdfs(user_id)
            if not pdf_text:
                logging.error("No extractable text found in user's PDFs.")
                return jsonify({'error': 'No user PDF data found for this user.'}), 400

            prompt = f"Based on the following reference material:\n\n{pdf_text[:2000]}\n\nAnswer this question: {text or 'No question provided.'}"

            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant who uses the given user documents to answer their question."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300
                )
                fake_answer = response.choices[0].message.content.strip()
                reasoning = f"Answer generated using user-uploaded PDFs for user_id: {user_id}"
            except Exception as e:
                logging.error(f"OpenAI API error with user PDFs: {str(e)}")
                fake_answer = "Could not generate answer due to an error."
                reasoning = "OpenAI API error while using user PDFs."

        reasoning_store[fake_answer] = reasoning
        logging.debug(f"Final answer: {fake_answer}")
        return jsonify({'answer': fake_answer})
    except Exception as e:
        logging.error(f"Unexpected server error: {str(e)}")
        return jsonify({'error': 'Internal server error occurred.'}), 500
# Endpoint: Retrieve the reasoning for a previously generated answer
@app.route('/get-reasoning', methods=['POST'])
def get_reasoning():
    try:
        answer = request.json.get('answer')
        logging.debug(f"Received answer: {answer}")
        reasoning = reasoning_store.get(answer, "No reasoning available for this answer.")
        logging.debug(f"Retrieved reasoning: {reasoning}")
        return jsonify({'reasoning': reasoning})
    except Exception as e:
        logging.error(f"Unexpected error occurred while retrieving reasoning: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

# Endpoint: Use GPT to decide if web search is needed and then either search or answer directly
@app.route('/websearch', methods=['POST'])
def analyze_text():
    data = request.get_json()
    input_text = data.get("text", "")
    search_results = []

    logging.debug("Checking if web search is required for: %s", input_text)
    needs_web_search = True

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": f"Should this query be answered using a web search? {input_text} Reply only with yes or no."}
            ],
            max_tokens=10
        )
        decision = response.choices[0].message.content.strip().lower()
        logging.debug("AI decision: %s", decision)
        needs_web_search = decision == "yes"
    except Exception as e:
        logging.error("AI reasoning error (falling back to default web search): %s", str(e))

    if not needs_web_search:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": f"Answer this question: {input_text}"}
                ],
                max_tokens=100
            )
            summarized = response.choices[0].message.content.strip()
            logging.debug("Generated direct AI answer: %s", summarized)
            return jsonify({'answer': summarized})
        except Exception as e:
            logging.error("AI direct answer error: %s", str(e))
            return jsonify({'answer': "Could not generate answer. Please try again."})

    logging.debug("Running web search for: %s", input_text)
    try:
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
        GOOGLE_CX = os.getenv("GOOGLE_CX")

        if not GOOGLE_API_KEY or not GOOGLE_CX:
            logging.error("Missing Google API credentials.")
            return jsonify({"error": "Missing Google API credentials"}), 500

        google_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": GOOGLE_API_KEY,
            "cx": GOOGLE_CX,
            "q": input_text,
            "num": 5
        }

        r = requests.get(google_url, params=params)
        google_data = r.json()

        if "items" in google_data:
            for item in google_data["items"]:
                snippet = item.get("snippet")
                if snippet:
                    search_results.append(snippet)
                    logging.debug("Added snippet: %s", snippet)
    except Exception as e:
        logging.error("Google Search API error: %s", str(e))
        search_results.append("No results found due to error.")

    combined_text = " ".join(search_results[:5]) or "No relevant results found."

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": f"Summarize these search results to answer this question: {input_text}\n\n{combined_text}"}
            ],
            max_tokens=150
        )
        summarized = response.choices[0].message.content.strip()
    except Exception as e:
        logging.error("AI summarization error: %s", str(e))
        summarized = f"This is an AI-generated summary of the web: {combined_text[:500]}..."

    return jsonify({'answer': summarized})













#picture page


# ✅ Set your OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY")

# saving the uploads
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Function to delete old files
def delete_old_files(folder, age_limit_hours=24):
    now = time.time()
    age_limit_seconds = age_limit_hours * 3600

    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath):
            file_age = now - os.path.getmtime(filepath)
            if file_age > age_limit_seconds:
                try:
                    os.remove(filepath)
                    logging.info(f"Deleted old file: {filename}")
                except Exception as e:
                    logging.error(f"Failed to delete {filename}: {e}")

# Start background cleanup thread
def start_cleanup_thread():
    def run_cleanup():
        while True:
            logging.debug("Running cleanup task for old files.")
            delete_old_files(UPLOAD_FOLDER, age_limit_hours=24)
            time.sleep(3600)  # Run every hour
    thread = threading.Thread(target=run_cleanup, daemon=True)
    thread.start()

# Image + description processing endpoint
@app.route('/process', methods=['POST'])
def process():
    image = request.files.get('image')
    description = request.form.get('description')

    filename = None
    if description:
        # ✅ Use DALL·E 3 API to generate an image based on the description
        try:
            logging.debug(f"Generating image from description: '{description}'")
            response = openai.Image.create(
                prompt=description,
                n=1,
                size="1024x1024"
            )
            image_url = response['data'][0]['url']
            message = f"Here's what DALL·E 3 created based on your description: '{description}'"
            return jsonify({"message": message, "imageUrl": image_url})
        except Exception as e:
            logging.error(f"Image generation failed: {str(e)}")
            return jsonify({"error": f"Image generation failed: {str(e)}"}), 500

    # Only proceed if an image was uploaded
    if image:
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)
        logging.debug(f"Image saved as {filename} in the upload folder.")

        # Pil.Image usage before AI response to resize and manipulate the image
        pil_image = Image.open(filepath)  # Open the image with PIL
        draw = ImageDraw.Draw(pil_image)  # Create a drawing object

        # Load font for adding text
        font = ImageFont.truetype("LiberationSans-Regular.ttf", size=20)
        # Draw some overlay text on the image
        draw.text((10, 10), "Hello", font=font, fill="white")  # Adds "Hello" text
        draw.text((10, 40), "AI Response Here", font=font, fill="white")  # Adds AI Response text

        # Save the modified image
        pil_image.save(filepath)
        logging.debug(f"Modified image saved at {filepath}.")

        # Downloading URL
        download_url = f"http://localhost:8000/download/imagepage/{filename}"
        message = f"Here's your uploaded image. Description: '{description or 'N/A'}'"
        return jsonify({"message": message, "downloadUrl": download_url})

    logging.error("No image or description provided.")
    return jsonify({"error": "No image or description provided"}), 400

# File download endpoint makes the response downloadable
@app.route('/download/imagepage/<filename>')
def download_imagepage(filename):
    # Download from UPLOAD_FOLDER specifically for the image page
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} for download.")
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
    logging.error(f"File {filename} not found in image page.")
    return jsonify({'error': 'File not found in image page'}), 404

# Example image manipulation with PIL
def manipulate_image():
    # Open an existing image (replace with an actual image file path)
    image = Image.open("your_image.png")
    # Create a drawing object
    draw = ImageDraw.Draw(image)
    # Load a font
    font = ImageFont.truetype("LiberationSans-Regular.ttf", size=20)

    # Draw text on the image at different positions
    draw.text((10, 10), "Hello", font=font, fill="white")
    draw.text((10, 40), "AI Response Here", font=font, fill="white")  # moved lower to avoid overlap
    # Save the modified image
    image.save("result.png")
    logging.debug("Image manipulation complete, saved as result.png.")

# Imagination page
@app.route('/generate-vision', methods=['POST'])
def generate_vision():
    description = request.form.get('description')
    
    # Add this to verify if description is being received
    logging.debug(f"Received description: {description}")  # Check if it's coming through

    if not description:
        logging.error("No description provided for image generation.")
        return jsonify({'error': 'No description provided'}), 400

    try:
        logging.debug(f"Generating image from description: '{description}'")
        response = openai.Image.create(
            prompt=description,
            n=1,
            size="1024x1024"
        )
        image_url = response['data'][0]['url']

        # Download the image and save it
        image_data = requests.get(image_url).content
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as f:
            f.write(image_data)
        logging.debug(f"Image saved locally at {filepath}.")

        # Return local download URL
        return jsonify({
            "imageUrl": image_url,
            "localFile": filename
        })
    except Exception as e:
        logging.error(f"Error in image generation: {str(e)}")
        return jsonify({"error": f"Image generation failed: {str(e)}"}), 500

@app.route('/download/imagination/<filename>')
def download_imagination(filename):
    # Download from 'uploads' specifically for imagination page
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} for download from imagination page.")
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
    logging.error(f"File {filename} not found in imagination page.")
    return jsonify({'error': 'File not found in imagination page'}), 404

# Start cleanup thread
logging.debug("Starting cleanup thread.")
start_cleanup_thread()














#video Real
# Define folders
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

file_registry = {}
API_KEY = os.getenv('SYNC_API_KEY')
SYNC_API_URL = "https://api.sync.so/v2/generate"

# ✅ Allowed extensions
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'mp3', 'wav'}

# ✅ Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ Function to delete old files from a folder after a given time
def delete_old_files(folder, age_limit_hours=6):  # ⬅ Set to 6 hours
    now = time.time()
    age_limit_seconds = age_limit_hours * 3600

    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath):
            file_age = now - os.path.getmtime(filepath)
            if file_age > age_limit_seconds:
                try:
                    os.remove(filepath)
                    logging.info(f"Deleted old file: {filename}")
                except Exception as e:
                    logging.error(f"Failed to delete {filename}: {e}")

# ✅ Start background cleanup thread on app startup
def start_cleanup_thread():
    def run_cleanup():
        while True:
            logging.debug("Running cleanup task for old files.")
            delete_old_files(UPLOAD_FOLDER, age_limit_hours=6)      # ⬅ Clean uploads folder
            delete_old_files(PROCESSED_FOLDER, age_limit_hours=6)   # ⬅ Clean processed folder
            time.sleep(3600)  # Run every hour
    thread = threading.Thread(target=run_cleanup, daemon=True)
    thread.start()

# ✅ Save file and register its upload time
def save_and_get_url(file, folder=UPLOAD_FOLDER):
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_name = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(folder, unique_name)
        file.save(filepath)
        base_url = request.host_url.rstrip('/')
        logging.debug(f"File saved with name: {unique_name}")
        return f"{base_url}/api/download/{unique_name}", unique_name
    logging.error("Invalid file upload or extension.")
    return None, None

# ✅ Main endpoint: Upload video + audio to Sync.so
@app.route('/api/upload-video-audio', methods=['POST'])
def upload_video_audio():
    if 'video' not in request.files or 'audio' not in request.files:
        logging.error('Both video and audio files are required')
        return jsonify({'error': 'Both video and audio files are required'}), 400

    video_file = request.files['video']
    audio_file = request.files['audio']

    # ✅ Validate file types
    if not allowed_file(video_file.filename) or not allowed_file(audio_file.filename):
        logging.error('Invalid file type. Allowed: mp4, webm, mp3, wav')
        return jsonify({'error': 'Invalid file type. Allowed: mp4, webm, mp3, wav'}), 400

    video_url, video_name = save_and_get_url(video_file)
    audio_url, audio_name = save_and_get_url(audio_file)

    if not video_url or not audio_url:
        logging.error('File upload failed or invalid extension')
        return jsonify({'error': 'File upload failed or invalid extension'}), 400

    payload = {
        "model": "lipsync-2",
        "input": [
            {"type": "video", "url": video_url},
            {"type": "audio", "url": audio_url}
        ]
    }

    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    try:
        logging.debug(f"Sending request to Sync API with payload: {payload}")
        response = requests.post(SYNC_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # ✅ Download the generated video from Sync.so to local processed folder
        video_result_url = data.get("video_url")
        if not video_result_url:
            logging.error('No video URL returned from Sync.so')
            return jsonify({'error': 'No video URL returned from Sync.so'}), 500

        video_response = requests.get(video_result_url)
        video_response.raise_for_status()

        local_filename = f"synced_{uuid.uuid4()}.mp4"
        local_filepath = os.path.join(PROCESSED_FOLDER, local_filename)
        with open(local_filepath, 'wb') as f:
            f.write(video_response.content)
        logging.info(f"Processed video saved as {local_filename}")

        local_url = f"{request.host_url.rstrip('/')}/api/download/{local_filename}"

        return jsonify({
            "success": True,
            "message": "Video synced and downloaded successfully.",
            "video_url": local_url,  # ✅ Local link to processed video
            "video_input": video_name,
            "audio_input": audio_name
        }), 200

    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Route for the general download (for processed or uploaded files)
@app.route('/api/download/<filename>')
def download_file(filename):
    # Check in the UPLOAD_FOLDER first
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} from UPLOAD_FOLDER for download.")
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

    # If not found in UPLOAD_FOLDER, check in the PROCESSED_FOLDER
    path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} from PROCESSED_FOLDER for download.")
        return send_from_directory(PROCESSED_FOLDER, filename, as_attachment=True)
    
    logging.error(f"File {filename} not found in either folder.")
    return jsonify({'error': 'File not found'}), 404

# ✅ Start cleanup thread (run automatically on startup)
# This runs independently and ensures uploaded files are cleaned up after 6 hours
logging.debug("Starting cleanup thread.")
start_cleanup_thread()









# the avatar 
# Directory setup
UPLOAD_FOLDER = 'uploads'
PROCESS_FOLDER = 'process'  # ✅ New folder for processed output
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESS_FOLDER, exist_ok=True)  # ✅ Ensure process folder exists
logging.info(f"Created directories: {UPLOAD_FOLDER}, {PROCESS_FOLDER}")

# Your Sync.so API Key and Endpoint URL
API_KEY = os.getenv('SYNC_API_KEY')
SYNC_API_URL = "https://api.sync.so/v2/generate"

# Configure file extensions allowed
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'mp3', 'wav', 'webm'}

# Check if file extension is allowed
def allowed_file(filename):
    if '.' in filename:
        file_ext = filename.rsplit('.', 1)[1].lower()
        logging.debug(f"Checking file extension: {file_ext}")
        return file_ext in ALLOWED_EXTENSIONS
    logging.warning("File does not have an extension.")
    return False

# ✅ Save file and return just the filename (not the full path)
def save_file(file, folder=UPLOAD_FOLDER):
    if file and allowed_file(file.filename):
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        file_path = os.path.join(folder, filename)
        file.save(file_path)
        logging.info(f"File saved: {filename}")
        return filename
    logging.error(f"Failed to save file: {file.filename} - Invalid file type or no file uploaded.")
    return None

# ✅ Background thread to delete old files after 6 hours
def delete_old_files(folder, age_limit_hours=6):
    now = time.time()
    age_limit_seconds = age_limit_hours * 3600

    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath):
            file_age = now - os.path.getmtime(filepath)
            if file_age > age_limit_seconds:
                try:
                    os.remove(filepath)
                    logging.info(f"Deleted old file: {filename}")
                except Exception as e:
                    logging.error(f"Failed to delete {filename}: {e}")

def start_cleanup_thread():
    def run_cleanup():
        while True:
            logging.debug("Running cleanup task for old files.")
            delete_old_files(UPLOAD_FOLDER, age_limit_hours=6)
            delete_old_files(PROCESS_FOLDER, age_limit_hours=6)  # ✅ Clean up process folder too
            time.sleep(3600)  # Run every hour
    thread = threading.Thread(target=run_cleanup, daemon=True)
    thread.start()
    logging.info("Started cleanup thread to remove old files.")

@app.route('/api/upload-avatar', methods=['POST'])
def upload_avatar():
    # Check if image and audio/video are provided
    if 'avatar' not in request.files or 'audio' not in request.files:
        logging.error('Both avatar image and audio/video files are required.')
        return jsonify({'error': 'Both avatar image and audio/video file are required'}), 400

    avatar_file = request.files['avatar']
    audio_file = request.files['audio']

    # ✅ Save the files and get filenames
    avatar_filename = save_file(avatar_file, folder=UPLOAD_FOLDER)
    audio_filename = save_file(audio_file, folder=UPLOAD_FOLDER)

    if not avatar_filename or not audio_filename:
        logging.error('Invalid file type or no file uploaded.')
        return jsonify({'error': 'Invalid file type or no file uploaded'}), 400

    # ✅ Generate URLs using only filename
    avatar_url = f"http://localhost:8000/uploads/{avatar_filename}"
    audio_url = f"http://localhost:8000/uploads/{audio_filename}"
    logging.debug(f"Generated URLs: Avatar URL - {avatar_url}, Audio URL - {audio_url}")

    # Prepare payload for Sync.so API
    payload = {
        "model": "avatar-1",
        "input": [
            {"type": "image", "url": avatar_url},
            {"type": "audio", "url": audio_url}
        ]
    }

    # Send request to Sync.so API
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    try:
        logging.debug(f"Sending request to Sync API with payload: {payload}")
        response = requests.post(SYNC_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # The video URL returned by Sync.so (external)
        video_url = data.get("video_url")

        if not video_url:
            logging.error('No video URL returned from Sync.so')
            return jsonify({'error': 'No video URL returned from Sync.so'}), 500

        # ✅ Download the video from Sync.so to local server
        video_response = requests.get(video_url)
        video_response.raise_for_status()

        local_video_filename = f"generated_video_{uuid.uuid4()}.mp4"
        local_video_path = os.path.join(PROCESS_FOLDER, local_video_filename)  # ✅ Save to process folder

        with open(local_video_path, 'wb') as f:
            f.write(video_response.content)
        logging.info(f"Video saved locally: {local_video_filename}")

        # ✅ Return local URL to the video
        return jsonify({
            "success": True,
            "message": "Avatar video generated successfully.",
            "video_url": f"http://localhost:8000/process/{local_video_filename}"  # ✅ Serve from process
        }), 200

    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# File serving endpoint (no changes here)
@app.route('/api/download/avatar/<filename>')
def download_avatar_file(filename):
    # Check in the UPLOAD_FOLDER first
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} from UPLOAD_FOLDER for download.")
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

    # If not found in UPLOAD_FOLDER, check in the PROCESSED_FOLDER
    path = os.path.join(PROCESS_FOLDER, filename)
    if os.path.exists(path):
        logging.debug(f"Sending file {filename} from PROCESSED_FOLDER for download.")
        return send_from_directory(PROCESS_FOLDER, filename, as_attachment=True)
    
    logging.error(f"File {filename} not found in either folder.")
    return jsonify({'error': 'File not found'}), 404

# ✅ Start cleanup thread when the app launches
logging.debug("Starting cleanup thread for old files.")
start_cleanup_thread()


if __name__ == '__main__':
    # Enable debug mode for development
    app.debug = True  # or app.config["DEBUG"] = True

    # Use port from environment variable or default to 8000
    port = int(os.environ.get("PORT", 8000))

    # Help to show all routes that are working
    print(app.url_map)

    # Run the Flask app on all interfaces
    app.run(host='0.0.0.0', port=port)


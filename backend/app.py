from pymongo import MongoClient
from datetime import datetime, UTC
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pdfplumber
import re
import pytesseract
from pdf2image import convert_from_bytes
import io

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# =========================
# STEP 1 — Load ML Model
# =========================
try:
    model = joblib.load("model.pkl")
    vectorizer = joblib.load("vectorizer.pkl")
    model_loaded = True
    print("[DEBUG] ML model and vectorizer loaded successfully")
except Exception as e:
    print(f"[DEBUG] Warning: Could not load model files: {e}")
    model_loaded = False
    model = None
    vectorizer = None
    
# =========================
# STEP 1 — PDF text extraction function
# =========================
def extract_pdf_text(file):
    """Extract text from PDF file using pdfplumber or OCR"""
    try:
        print("[DEBUG] PDF extraction started")

        # Read file bytes once
        file_bytes = file.read()
        print(f"[DEBUG] PDF size: {len(file_bytes)} bytes")

        text = ""

        # Try normal PDF text extraction first
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + " "
        except Exception as pdf_error:
            print(f"[DEBUG] PDF extraction error (will try OCR): {pdf_error}")

        print(f"[DEBUG] Text extracted: {len(text)} characters")

        # If no text extracted → run OCR fallback
        if len(text.strip()) < 50:
            print("[DEBUG] PDF text insufficient, running OCR fallback")
            try:
                images = convert_from_bytes(file_bytes)
                for i, img in enumerate(images):
                    ocr_text = pytesseract.image_to_string(img)
                    text += ocr_text + " "
                print(f"[DEBUG] OCR extracted: {len(text)} characters from {len(images)} pages")
            except Exception as ocr_error:
                print(f"[DEBUG] OCR error: {ocr_error}")

        print("\n====== PDF EXTRACTED TEXT (first 500 chars) ======")
        print(text[:500])
        print("=================================================\n")

        return text

    except Exception as e:
        print(f"[ERROR] PDF extraction failed: {e}")
        return ""

# =========================
# STEP 2 — Text cleaning function
# =========================
def clean_text(text):
    """Clean and normalize text for ML processing"""
    text = text.lower()
    text = text.replace("\n", " ")
    text = text.replace("\r", " ")
    text = re.sub(r"\s+", " ", text)
    return text

# =========================
# STEP 3 — MongoDB Atlas Connection
# =========================
MONGO_URI = "mongodb+srv://charansaikoppisetti36_db_user:jqxd6rGyG5jJixKb@cluster0.y78e7zb.mongodb.net/fakejobdb?retryWrites=true&w=majority"
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client["fakejobdb"]
    collection = db["predictions"]
    mongo_available = True
except Exception as e:
    print(f"MongoDB connection warning: {e}")
    mongo_available = False

# =========================
# API ENDPOINT — Analyze Job Offer
# =========================
@app.route("/api/analyze", methods=["POST"])
def analyze_offer():
    """
    Accepts JSON with job offer details and returns risk analysis
    """
    try:
        # Initialize variables
        job_text = ""
        email = ""
        company_name = ""
        salary = ""
        location = ""
        reasons = []

        # Check if PDF uploaded
        file = request.files.get("pdf")
        print("FILE RECEIVED:", file)
        print("FILES DICT:", request.files)

        pdf_text = ""
        description_text = ""

        if file:
            # Extract text from PDF
            pdf_text = extract_pdf_text(file)
            
            # Get metadata from form data (PDF upload path)
            email = request.form.get("email", "").lower()
            company_name = request.form.get("companyName", "").lower()
            salary = request.form.get("salary", "")
            location = request.form.get("location", "")
            
            # Also check for description in form data
            description_text = request.form.get("jobDescription", "")

        else:
            # FormData without PDF file, OR JSON input
            # Try to get data from form first, then fall back to JSON
            if request.form:
                # FormData without file
                email = request.form.get("email", "").lower()
                company_name = request.form.get("companyName", "").lower()
                salary = request.form.get("salary", "")
                location = request.form.get("location", "")
                description_text = request.form.get("jobDescription", "")
            else:
                # Try JSON input (legacy/fallback)
                try:
                    data = request.get_json()
                    if data:
                        email = (data.get("email", "") or "").lower()
                        company_name = (data.get("companyName", "") or "").lower()
                        salary = data.get("salary", "")
                        location = data.get("location", "")
                        description_text = data.get("jobDescription", "")
                except Exception as json_error:
                    print(f"[DEBUG] JSON parsing error: {json_error}")
                    return jsonify({
                        "success": False,
                        "error": "Invalid request format",
                        "message": "Request must be FormData or valid JSON"
                    }), 400

        # Filter placeholder text from both PDF uploads and JSON requests
        # This ensures consistent behavior regardless of input method
        description_text = description_text.strip()
        if description_text.startswith("[Uploaded file"):
            description_text = ""

        # Combine PDF text and description for consistent ML input
        # This ensures predictions are consistent regardless of input method
        job_text = f"{pdf_text} {description_text}".lower()

        # Clean extracted text
        print("[DEBUG] Cleaned text:", job_text[:300])
        job_text = clean_text(job_text)

        # Extra normalization to stabilize ML input
        job_text = job_text.lower()
        job_text = re.sub(r"\s+", " ", job_text)
        job_text = re.sub(r"[^a-z0-9₹$., ]", " ", job_text)
        job_text = job_text.strip()
        
        risk_score = 0
        result = ""
        ml_prediction = "Genuine"
        
        # Combine text for analysis
        combined_text = f"{job_text} {email} {company_name}".lower()
        offer_type = "Job Offer"
        if "internship" in combined_text:
            offer_type = "Internship"

        # =========================
        # STEP 3 — Enhanced ML Prediction
        # =========================
        ml_probability = 0
        ml_confidence = 0

        print(f"\n[DEBUG] Starting risk calculation for: {company_name if company_name else 'Unknown'}")

        if not model_loaded or model is None or vectorizer is None:
            print("[DEBUG] Model not available, setting low risk")
            risk_score = 0
            ml_prediction = "Model Unavailable"
            ml_confidence = 0
        elif job_text.strip() != "":
            try:
                # IMPROVED ML INPUT: Combine jobDescription, email, and companyName for better analysis
                # Normalize text more aggressively
                job_text = re.sub(r"[^a-zA-Z0-9₹$., ]", " ", job_text)
                job_text = re.sub(r"\s+", " ", job_text).strip()

                combined_for_ml = f"{job_text} {email} {company_name}"

                print("\n===== FINAL TEXT SENT TO MODEL =====")
                print(combined_for_ml[:500])
                print("====================================")
                
                X_input = vectorizer.transform([combined_for_ml])

                # ML PROBABILITY CALCULATION: Extract fraud probability from the trained model
                if hasattr(model, 'predict_proba'):
                    ml_probability = model.predict_proba(X_input)[0][1]
                else:
                    decision = model.decision_function(X_input)[0]
                    ml_probability = 1 / (1 + np.exp(-decision))

                print(f"[DEBUG] ML Probability (fraud): {ml_probability:.4f}")

                # Convert ML probability to base score (0-100 scale)
                ml_score = int(ml_probability * 100)

                # =========================
                # RULE-BASED SCORING (0-100 scale)
                # =========================
                rule_score = 0

                # Simple rule-based indicators
                if "fee" in job_text:
                    rule_score += 20
                    reasons.append("Payment/fee language detected")

                if "whatsapp" in job_text:
                    rule_score += 15
                    reasons.append("WhatsApp contact preferred")

                if "telegram" in job_text:
                    rule_score += 15
                    reasons.append("Telegram contact preferred")

                if "gmail.com" in email:
                    rule_score += 10
                    reasons.append("Recruiter using Gmail domain")

                # Cap rule score at 100
                rule_score = min(100, rule_score)

                # =========================
                # WEIGHTED RISK SCORE CALCULATION
                # ML model (70%) + Rule indicators (30%)
                # =========================
                risk_score = int(0.7 * ml_score + 0.3 * rule_score)
                risk_score = min(100, risk_score)

                # Determine status
                if risk_score >= 61:
                    ml_prediction = "High Risk"
                elif risk_score >= 31:
                    ml_prediction = "Suspicious"
                else:
                    ml_prediction = "Safe"

                ml_confidence = round(ml_probability * 100, 2)

                print(f"[DEBUG] ML Score: {ml_score}")
                print(f"[DEBUG] Rule Score: {rule_score}")
                print(f"[DEBUG] Final Risk Score: {risk_score}")
                print(f"[DEBUG] Status: {ml_prediction}")


            except Exception as e:
                print(f"[DEBUG] ML Model error: {e}")
                ml_prediction = "Error"
                ml_confidence = 0
                risk_score = 0

        else:
            print("[DEBUG] Empty job description - setting low risk")
            risk_score = 0
            ml_prediction = "Safe"
            ml_confidence = 0

        # =========================
        # STEP 4 — Store in MongoDB (Optional)
        # =========================
        if mongo_available:
            try:
                data_to_store = {
                    "job_text": job_text,
                    "email": email,
                    "company_name": company_name,
                    "salary": salary,
                    "location": location,
                    "risk_score": risk_score,
                    "ml_confidence": ml_confidence,
                    "status": ml_prediction,
                    "reasons": reasons,
                    "timestamp": datetime.now(UTC)
                }
                collection.insert_one(data_to_store)
                print(f"[DEBUG] Stored in MongoDB: risk_score={risk_score}, status={ml_prediction}")
            except Exception as e:
                print(f"[DEBUG] MongoDB insert error: {e}")

        # =========================
        # Return JSON Response
        # =========================
        print(f"[DEBUG] Sending response: risk_score={risk_score}, status={ml_prediction}, confidence={ml_confidence}%\n")
        
        response = {
            "risk_score": risk_score,
            "status": ml_prediction,
            "ml_confidence": ml_confidence,
            "reasons": reasons,
            "success": True
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Error processing request"
        }), 400


# =========================
# Health Check Endpoint
# =========================
@app.route("/api/health", methods=["GET"])
def health():
    """Check if API is running"""
    return jsonify({
        "status": "healthy",
        "mongo": "connected" if mongo_available else "disconnected",
        "model": "loaded" if model_loaded else "unavailable"
    }), 200


# =========================
# Root Endpoint (for testing)
# =========================
@app.route("/", methods=["GET"])
def index():
    """API documentation"""
    return jsonify({
        "name": "Job Offer ML Detector API",
        "version": "1.0",
        "endpoints": {
            "POST /api/analyze": "Analyze job offer for fraud",
            "GET /api/health": "Health check"
        },
        "example_request": {
            "jobDescription": "Work from home, earn unlimited, no experience needed",
            "email": "recruiter@gmail.com",
            "companyName": "TechCorp",
            "salary": "150000",
            "location": "Remote"
        }
    }), 200


if __name__ == "__main__":
    print("\n" + "="*50)
    print("Starting Flask Backend Server")
    print("="*50)
    print("API URL: http://localhost:5000/api/analyze")
    print("Health Check: http://localhost:5000/api/health")
    print("="*50 + "\n")
    
    # Run Flask with Windows-compatible socket settings
    # use_reloader=False prevents double initialization on Windows
    # threaded=True allows concurrent requests
    app.run(
        debug=True, 
        host="0.0.0.0", 
        port=5000,
        use_reloader=False,  # Disable reloader to avoid socket issues on Windows
        threaded=True        # Allow multiple concurrent requests
    )
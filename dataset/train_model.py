import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score

# =========================
# STEP 1 — Load Dataset
# =========================
df = pd.read_csv("fake_job_posting.csv")

# =========================
# STEP 2 — Combine Multiple Text Fields for Training
# =========================
# Improved text feature engineering: combine title, company_profile, description, and requirements
# This provides richer context for the model to detect fraud patterns
df['text'] = (
    df['title'].fillna('') + " " +
    df['company_profile'].fillna('') + " " +
    df['description'].fillna('') + " " +
    df['requirements'].fillna('')
)

# Convert text to lowercase for better consistency
df['text'] = df['text'].str.lower()

# Select relevant columns and handle missing values
df = df[['text', 'fraudulent']].dropna()

X = df['text']
y = df['fraudulent']

print("=" * 50)
print("FAKE JOB DETECTION MODEL TRAINING")
print("=" * 50)
print(f"Total samples: {len(df)}")
print("\nClass distribution:")
print(y.value_counts())
print(f"Fraud percentage: {(y.sum() / len(y) * 100):.2f}%")

# =========================
# STEP 3 — Train/Test Split
# =========================
# Use stratified split to maintain class distribution in both sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"\nTrain set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

# =========================
# STEP 4 — TF-IDF Vectorization with Improved Parameters
# =========================
# Optimized vectorizer: reduced features for faster processing, filters for better quality
# min_df: ignore terms appearing in fewer than 2 documents (removes noise)
# max_df: ignore terms appearing in more than 80% of documents (removes common words)
print("\nVectorizing text features (this may take a moment)...")
vectorizer = TfidfVectorizer(
    stop_words='english',
    max_features=2000,
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.8,
)

X_train_vec = vectorizer.fit_transform(X_train)
print("Training set vectorization complete!")
X_test_vec = vectorizer.transform(X_test)
print("Test set vectorization complete!")

print(f"\nVectorizer created with {len(vectorizer.get_feature_names_out())} features")

# =========================
# STEP 5 — Train Logistic Regression Model
# =========================
# Strong classifier with appropriate hyperparameters
model = LogisticRegression(max_iter=200)

print("\nTraining Logistic Regression model...")
model.fit(X_train_vec, y_train)
print("Model training completed!")

# =========================
# STEP 6 — Model Evaluation
# =========================
y_pred = model.predict(X_test_vec)
y_proba = model.predict_proba(X_test_vec)[:, 1]

# Calculate evaluation metrics
accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_proba)

print("\n" + "=" * 50)
print("MODEL EVALUATION METRICS")
print("=" * 50)
print(f"Accuracy: {accuracy:.4f}")
print(f"ROC-AUC Score: {roc_auc:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# =========================
# STEP 7 — Save Model and Vectorizer
# =========================
# Save using joblib for better compatibility with Flask backend
joblib.dump(model, "../backend/model.pkl")
joblib.dump(vectorizer, "../backend/vectorizer.pkl")

print("\n" + "=" * 50)
print("Model and vectorizer saved successfully!")
print("Files saved to: ../backend/")
print("=" * 50)
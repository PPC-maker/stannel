#!/bin/bash
# STANNEL Deployment Script for Google Cloud

set -e

PROJECT_ID="stannel-app"
REGION="me-west1"

echo "🚀 STANNEL Deployment Script"
echo "=============================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📌 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create Artifact Registry repository if not exists
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create stannel \
    --repository-format=docker \
    --location=$REGION \
    --description="STANNEL Docker images" \
    2>/dev/null || echo "   Repository already exists"

# Configure Docker auth
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# Deploy using Cloud Build
echo "🏗️  Starting Cloud Build deployment..."
gcloud builds submit --config=cloudbuild.yaml .

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your services should be available at:"
echo "   API: https://stannel-api-xxxxxxxx-$REGION.a.run.app"
echo "   Web: https://stannel-web-xxxxxxxx-$REGION.a.run.app"
echo ""
echo "Run 'gcloud run services list' to see exact URLs"

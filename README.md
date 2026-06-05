# Multimodal AI E-commerce Intelligence & Automation Agent

An AI SaaS project that helps e-commerce sellers automate product listing creation, product intelligence, customer support, ad generation, and product research using multimodal AI, RAG, and agentic AI workflows.

## MVP

The first version will focus on:

- Uploading a product image
- Generating a product title
- Detecting category
- Extracting product attributes
- Writing a product description
- Creating SEO keywords

## Tech Stack

### Frontend
- Next.js
- Tailwind CSS

### Backend
- FastAPI
- Python

### AI
- Qwen2-VL or LLaVA
- Ollama for local testing

### RAG
- FAISS
- Sentence Transformers

### Database
- SQLite for MVP
- PostgreSQL later

## MVP Flow

User uploads product image → Backend receives image → AI model analyzes image → Product listing JSON is returned → User edits and saves listing.

## Project Status

Week 1 Day 1: Project setup and planning.
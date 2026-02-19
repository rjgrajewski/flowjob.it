# Atlas - AI Skills Analysis

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)

## 🚀 Overview

Atlas is the intelligence layer of Aligno, responsible for analyzing raw job data collected by Scout. Currently, it focuses on **Skills Normalization** using specific Large Language Models (LLMs) via AWS Bedrock.

## 🔧 Key Features

- **Skill Extraction**: Extracts raw skills from the `tech_stack` field of offers.
- **Normalization**: Uses **Claude 3.5 Sonnet** (via AWS Bedrock) to canonicalize skill names (e.g., "React.js" -> "React").
- **Deduplication**: Uses **Claude 3 Haiku** to semantically deduplicate similar skills into clusters.
- **Linking**: Links job offers to their canonicalized skills in the database.

## 📁 Architecture

```
atlas/
├── __main__.py              # Entry point for Atlas
├── normalize_skills.py      # Core pipeline: Extract -> Normalize -> Dedup -> Link
└── README.md                # This file
```

## ⚙️ How it Works (`normalize_skills.py`)

The normalization pipeline consists of 4 main steps:

1.  **Extract Distinct Skills**:
    - Reads `tech_stack` from `offers`.
    - Inserts distinct raw names into the `skills` table (`original_skill_name`).

2.  **AI Normalization**:
    - Batches un-normalized skills.
    - Sends them to Claude 3.5 Sonnet with context (Category) to determine the standard name.
    - Updates `ai_normalized_name`.

3.  **Semantic Deduplication**:
    - Fetches all distinct canonical names.
    - Uses Claude 3 Haiku to identify and merge synonyms (e.g. "AI Assistant" -> "AI Code Assistants").

4.  **Link Offers**:
    - Links existing offers to the `skills` table via the `offer_skills` join table.

## 🚧 Status

**Current Status**: *Functional Beta*

The normalization pipeline is active and being tuned.

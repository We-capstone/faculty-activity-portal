@app.route('/process_invoices', methods=['POST'])
def process_invoices():

    uploaded_files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        if allowed_file(filename):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            uploaded_files.append(filepath)

    if not uploaded_files:
        return jsonify({"error": "No files to process"}), 400

    responses = []

    for filepath in uploaded_files:
        try:
            extracted_text = extract_text(filepath)

            if not extracted_text.strip():
                raise ValueError("OCR failed to extract text")

            # 🔥 NEW PROMPT FOR ACADEMIC DOCUMENTS
            user_prompt = f"""
You are an academic document analyzer.

Below is OCR extracted text:

\"\"\"{extracted_text}\"\"\"

Step 1: Identify document type:
- CONFERENCE
- RESEARCH_FUNDING
- PATENT
- UNKNOWN

Step 2: Extract structured fields based on type.

If CONFERENCE:
{{
  "title": "",
  "conference_name": "",
  "author_position": null,
  "conference_date": "YYYY-MM-DD",
  "proceedings_details": "",
  "conference_link": "",
  "indexing_details": ""
}}

If RESEARCH_FUNDING:
{{
  "funding_agency": "",
  "project_title": "",
  "amount": null,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}}

If PATENT:
{{
  "patent_title": "",
  "application_no": "",
  "patent_status": "",
  "filed_date": "YYYY-MM-DD",
  "published_date": "YYYY-MM-DD",
  "granted_date": "YYYY-MM-DD"
}}

Return ONLY valid JSON in this exact format:

{{
  "document_type": "...",
  "extracted_data": {{ ... }},
  "confidence": 0.0
}}

Rules:
- Missing fields must be null
- Dates must be YYYY-MM-DD
- Confidence must be between 0 and 1
- No explanations
"""

            result = gemini_json_output(user_prompt)

            confidence = result.get("confidence", 0)

            try:
                confidence = float(confidence)
                confidence = max(0, min(1, confidence))
            except:
                confidence = 0

            responses.append({
                "filename": os.path.basename(filepath),
                "document_type": result.get("document_type", "UNKNOWN"),
                "extracted_data": result.get("extracted_data", {}),
                "confidence": round(confidence, 2)
            })

        except Exception as e:
            responses.append({
                "filename": os.path.basename(filepath),
                "error": str(e)
            })

        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

    return jsonify(responses), 200
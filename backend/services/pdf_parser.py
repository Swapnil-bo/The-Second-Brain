# Description: PDF text extraction using PyMuPDF (fitz). Handles empty/image-only PDFs
# gracefully with a clear error message.

import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract all text from a PDF byte stream.

    Raises ValueError if the PDF is image-only (no extractable text).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_text: list[str] = []

    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages_text.append(text.strip())

    doc.close()

    if not pages_text:
        raise ValueError("PDF appears to be image-only. OCR not supported yet.")

    return "\n\n".join(pages_text)

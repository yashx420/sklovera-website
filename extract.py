import sys
try:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    for page in reader.pages:
        print(page.extract_text())
except ImportError:
    try:
        import fitz
        doc = fitz.open(sys.argv[1])
        for page in doc:
            print(page.get_text())
    except ImportError:
        print("Required libraries not found. Try installing pypdf or PyMuPDF.")

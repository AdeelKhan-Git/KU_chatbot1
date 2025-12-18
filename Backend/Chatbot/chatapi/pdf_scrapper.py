# import re
# import fitz

# def clean_text(text):
#     """Clean text, fix repeated letters (3+), extra spaces, repeated punctuation."""
#     if not text:
#         return ""
#     text = re.sub(r'\s+', ' ', text)  # normalize spaces
#     text = re.sub(r'([A-Za-z])\1{2,}', r'\1', text)  # collapse 3+ repeated letters
#     text = re.sub(r'\.{2,}', '.', text)  # repeated periods
#     text = re.sub(r',+', ',', text)      # repeated commas
#     text = re.sub(r'/+', '/', text)      # repeated slashes
#     text = re.sub(r'-+', '-', text)      # repeated hyphens
#     # Fix malformed fees like Rs.66,5500,000000/- -> Rs.6,655,000/-
#     text = re.sub(r'Rs\.?[\d,]+', lambda m: format_fee(m.group()), text)
#     return text.strip()

# def format_fee(fee_text):
#     """Format fee string properly."""
#     nums = re.findall(r'\d+', fee_text)
#     if not nums:
#         return fee_text
#     num = ''.join(nums)
#     try:
#         num_int = int(num)
#         # format with commas in thousands
#         return f"Rs.{num_int:,}/-"
#     except:
#         return fee_text

# def is_garbage(line):
#     """Detect lines mostly numbers/garbage."""
#     line_clean = line.replace(" ", "")
#     if len(line_clean) == 0:
#         return True
#     num_ratio = sum(1 for c in line_clean if not c.isalpha()) / len(line_clean)
#     return num_ratio > 0.6

# def remove_duplicates(lines):
#     """Remove consecutive duplicate lines."""
#     result = []
#     prev = None
#     for line in lines:
#         if line != prev:
#             result.append(line)
#             prev = line
#     return result

# def table_to_text(lines):
#     """Convert table lines (starting with S. #) into text."""
#     table_lines = []
#     for line in lines:
#         if re.match(r'S\. #', line):
#             table_lines.append(clean_text(line))
#     return "\n".join(table_lines)

# def extract_pdf_content(file):
#     """Extract clean PDF content with tables and paragraphs."""
#     all_data = []
#     doc = fitz.open(stream=file.read(), filetype="pdf") if hasattr(file, "read") else fitz.open(file)
    
#     for page_num in range(len(doc)):
#         page = doc[page_num]
#         print(f"Processing page {page_num + 1}/{len(doc)}...")
#         text = page.get_text()  # extract text
#         lines = [clean_text(line) for line in text.split("\n") if line.strip()]
#         lines = remove_duplicates(lines)  # remove duplicate lines

#         table_text = table_to_text(lines)
#         paragraph_lines = [line for line in lines if not line.startswith("S. #:") and not is_garbage(line)]
#         paragraph_text = "\n".join(paragraph_lines)

#         content = ""
#         if table_text:
#             content += table_text + "\n"
#         if paragraph_text:
#             content += paragraph_text

#         if content.strip():
#             all_data.append({
#                 "page": page_num + 1,
#                 "content": content.strip()
#             })
#     return all_data




import fitz
import re
from collections import defaultdict



# =========================================================
# CLEANERS
# =========================================================

def clean_text(text):
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    # This deduplication can sometimes be too aggressive, but keeping it as per original
    text = re.sub(r'([A-Za-z])\1{2,}', r'\1', text) 
    return text

def normalize_amount(text):
    def repl(m):
        num = int("".join(re.findall(r'\d+', m.group())))
        return f"Rs.{num:,}/-"
    return re.sub(r'Rs\.?\s*[\d,]+', repl, text)

def is_phone(text):
    return bool(re.search(r'\b\d{3,5}[-]?\d{4,7}\b', text))

def normalize_line(text):
    text = clean_text(text)
    text = re.sub(r'[|]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower()


def fix_hyphenation(text):
    # This handles hyphenation across lines
    text = re.sub(r'-\s+', '', text)   
    return text

def dedupe_row(row):
    out = []
    for c in row:
        if c not in out:
            out.append(c)
    return out

def is_heading(row):
    text = " ".join(row)
    return (
        len(row) == 1 and
        text.upper() == text and
        len(text) > 12
    )

# =========================================================
# LAYOUT EXTRACTION (PDF GEOMETRY BASED)
# =========================================================
def extract_layout_rows(page):
    rows = defaultdict(list)

    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            y = round(line["bbox"][1], 1)
            for span in line["spans"]:
                txt = clean_text(span["text"])
                if txt:
                    rows[y].append((span["bbox"][0], txt))

    structured = []
    for y in sorted(rows.keys()):
        cols = sorted(rows[y], key=lambda x: x[0])
        structured.append({
            "y": y,
            "cells": [c[1] for c in cols]
        })

    return structured

def extract_layout_rows_for_two_col(page):
    rows = defaultdict(list)

    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            y = round(line["bbox"][1], 1)
            for span in line["spans"]:
                txt = clean_text(span["text"])
                if txt:
                    rows[y].append((span["bbox"][0], txt))

    structured = []
    for y in sorted(rows.keys()):
        cols = sorted(rows[y], key=lambda x: x[0])
        structured.append({
            "y": y,
            "cells": [c[1] for c in cols],
            "cells_with_x": cols
        })

    return structured



def has_table_structure(page, min_rows=5):
    rows = extract_layout_rows(page)
    structured = 0

    for r in rows:
        if len(r["cells"]) >= 3:
            structured += 1

    # table pages have MANY consecutive structured rows
    return structured >= min_rows and structured / len(rows) > 0.6


def split_columns(page, rows):
    page_width = page.rect.width
    mid_x = page_width / 2

    left_rows = []
    right_rows = []

    for row in rows:
        left_cells = []
        right_cells = []

        for span_x, text in row["cells_with_x"]:
            if span_x < mid_x:
                left_cells.append(text)
            else:
                right_cells.append(text)

        if left_cells:
            left_rows.append({"y": row["y"], "cells": left_cells})
        if right_cells:
            right_rows.append({"y": row["y"], "cells": right_cells})

    return left_rows, right_rows


def is_split_table_page(page):
    rows = extract_layout_rows_for_two_col(page)

    left_cols = 0
    right_cols = 0
    page_width = page.rect.width
    mid = page_width / 2

    for r in rows:
        for x, txt in r["cells_with_x"]:
            if re.search(r'Rs\.\s*\d', txt):
                if x > mid:
                    right_cols += 1
            elif len(txt.split()) > 2:
                if x < mid:
                    left_cols += 1

    return left_cols > 5 and right_cols > 5


def prepare_for_embedding(text):
    text = fix_hyphenation(text)
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()



def merge_multiline_cells(rows, y_tolerance=6):
    merged = []
    prev = None

    for r in rows:
        if not prev:
            prev = r
            continue

        # same column count AND y is very close → continuation
        if (
            len(r["cells"]) == len(prev["cells"]) and
            abs(r["y"] - prev["y"]) <= y_tolerance
        ):
            prev["cells"] = [
                prev["cells"][i] + " " + r["cells"][i]
                for i in range(len(r["cells"]))
            ]
        else:
            merged.append(prev)
            prev = r

    if prev:
        merged.append(prev)

    return merged

# =========================================================
# MAIN PDF EXTRACTION - WITH FIX
# =========================================================


def extract_pdf_content(file):
    doc = fitz.open(stream=file.read(), filetype="pdf") if hasattr(file, "read") else fitz.open(file)
    all_pages = []

    for page_no, page in enumerate(doc, start=1):
        print(f"Processing page {page_no}")
        content = []

        # -----------------------------------
        # 1️⃣ TABLE PAGES (Officials, Deans)
        # -----------------------------------
        if has_table_structure(page):
            rows = extract_layout_rows(page)
            i = 0
            while i < len(rows):
                cells = dedupe_row(rows[i]["cells"])

                if i > 0 and cells == dedupe_row(rows[i-1]["cells"]):
                    i += 1
                    continue

                if is_heading(cells):
                    content.append(" ".join(cells))
                    i += 1
                    continue

                if len(cells) >= 3:
                    content.append(" | ".join(cells))
                else:
                    content.append(" ".join(cells))

                i += 1

        elif is_split_table_page(page):
            rows = extract_layout_rows(page)

            # 🔥 FIX: merge multi-line cells BEFORE formatting
            rows = merge_multiline_cells(rows)

            for r in rows:
                cells = dedupe_row(r["cells"])
                if len(cells) >= 3:
                    content.append(" | ".join(cells))
                else:
                    content.append(" ".join(cells))
                    
        # ===============================
        # TWO-COLUMN PAGES (Narrative)
        # ===============================
        else:
            rows = extract_layout_rows_for_two_col(page)

            x_positions = [x for r in rows for x, _ in r["cells_with_x"]]
            is_two_column = (
                len(x_positions) > 15 and
                max(x_positions) - min(x_positions) > page.rect.width * 0.6
            )

            if is_two_column:
                left, right = split_columns(page, rows)
                rows = left + right


            # Extract text
            for r in rows:
                cells = dedupe_row(r["cells"])
                line = fix_hyphenation(normalize_amount(" ".join(cells)))

                if line:
                    content.append(line)

        # ===============================
        # SINGLE-COLUMN / FALLBACK PAGE
        # =================================
        if not content:
            rows = extract_layout_rows(page)
            for r in rows:
                line = " ".join(dedupe_row(r["cells"]))
                if line:
                    content.append(line)


        raw_text = "\n".join(content).strip()
        all_pages.append({
            "page": page_no,
            "content":  raw_text
        })

    return all_pages




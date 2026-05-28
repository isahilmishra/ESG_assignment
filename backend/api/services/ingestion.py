import csv
import io
import re
from datetime import datetime
from api.models import ESGRecord, AuditLog

def parse_date(date_str, formats):
    if not date_str:
        return None
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            pass
    return None

def detect_delimiter(sample_text):
    """Dynamically detects the delimiter based on occurrence counts."""
    delimiters = [';', ',', '\t', '|']
    counts = {d: sample_text.count(d) for d in delimiters}
    # Return the one with the highest count, default to comma
    return max(counts, key=counts.get) if max(counts.values()) > 0 else ','

def parse_european_number(num_str):
    """Converts a messy number string (e.g. '1.500,50' or '1,500.50') into a float."""
    if not num_str:
        return 0.0
    num_str = str(num_str).strip().replace('"', '')
    if not num_str or num_str == '-':
        return 0.0
        
    # If it contains both comma and dot, assume the last one is the decimal
    if ',' in num_str and '.' in num_str:
        if num_str.rindex(',') > num_str.rindex('.'):
            # European format: 1.500,50
            num_str = num_str.replace('.', '').replace(',', '.')
        else:
            # US format: 1,500.50
            num_str = num_str.replace(',', '')
    elif ',' in num_str:
        # e.g. "45,000" or "45,50". We guess based on decimal places.
        parts = num_str.split(',')
        if len(parts[-1]) == 2: # Likely 45,50
            num_str = num_str.replace(',', '.')
        else: # Likely 45,000
            num_str = num_str.replace(',', '')
            
    try:
        return float(num_str)
    except ValueError:
        return 0.0

def fuzzy_get(row_dict, aliases):
    """Finds a value in a dictionary where the key matches any of the aliases (case-insensitive)."""
    for key, value in row_dict.items():
        if not key:
            continue
        cleaned_key = key.strip().lower()
        if any(alias.lower() in cleaned_key for alias in aliases):
            return value
    return ''

def extract_data_rows(csv_file_bytes):
    """Skips metadata and finds the actual CSV header and data."""
    lines = csv_file_bytes.decode('utf-8', errors='ignore').splitlines()
    if not lines:
        return []
        
    # Heuristic: The header row usually has the most delimiters
    sample = "\n".join(lines[:10])
    delimiter = detect_delimiter(sample)
    
    header_idx = 0
    max_columns = 0
    for i, line in enumerate(lines[:15]): # Search first 15 lines for the header
        cols = line.count(delimiter)
        if cols > max_columns:
            max_columns = cols
            header_idx = i
            
    csv_data = "\n".join(lines[header_idx:])
    return list(csv.DictReader(io.StringIO(csv_data), delimiter=delimiter))


def process_sap_data(csv_file, company, source):
    records = []
    PLANT_LOOKUP = {
        'W001': 'Berlin Logistics Hub',
        'W002': 'Munich Headquarters',
        'W003': 'Frankfurt Manufacturing'
    }
    
    rows = extract_data_rows(csv_file.read())
    for row in rows:
        raw_date = fuzzy_get(row, ['Buchungsdatum', 'Posting Date', 'Date'])
        date = parse_date(raw_date, ['%Y-%m-%d', '%d.%m.%Y', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%y'])
        
        raw_quantity = fuzzy_get(row, ['Menge', 'Quantity', 'Qty', 'Amount'])
        quantity = parse_european_number(raw_quantity)
            
        unit = fuzzy_get(row, ['Basismengeneinheit', 'Unit', 'UOM'])
        material = fuzzy_get(row, ['Materialbezeichnung', 'Material', 'Desc'])
        plant_code = fuzzy_get(row, ['Werk', 'Plant', 'Location'])
        plant_name = PLANT_LOOKUP.get(plant_code.upper(), f'Unknown Plant ({plant_code})')
        
        scope = 'SCOPE_3'
        category = f'Procurement - {material}'
        if unit.upper() in ['L', 'LITERS', 'GAL', 'KG']:
            scope = 'SCOPE_1'
            category = f'Fuel Consumption ({plant_name})'
        elif unit.upper() in ['KWH', 'MWH']:
            scope = 'SCOPE_2'
            category = f'Purchased Electricity ({plant_name})'
            
        status = 'PENDING'
        notes = ''
        if not date or quantity == 0.0:
            status = 'FLAGGED'
            notes = 'Auto-flagged during ingestion: Missing/invalid date or zero quantity.'
            
        record = ESGRecord.objects.create(
            company=company, source=source, original_data=row,
            scope=scope, category=category, normalized_value=quantity,
            normalized_unit=unit, period_start=date, period_end=date,
            status=status, notes=notes
        )
        AuditLog.objects.create(record=record, action="Created via SAP Ingestion", new_state=row)
        records.append(record)
    return records

def process_utility_data(csv_file, company, source):
    records = []
    rows = extract_data_rows(csv_file.read())
    for row in rows:
        raw_start = fuzzy_get(row, ['Start Date', 'From', 'Begin'])
        raw_end = fuzzy_get(row, ['End Date', 'To'])
        
        start_date = parse_date(raw_start, ['%Y-%m-%d', '%m/%d/%Y', '%d.%m.%Y'])
        end_date = parse_date(raw_end, ['%Y-%m-%d', '%m/%d/%Y', '%d.%m.%Y'])
        
        raw_usage = fuzzy_get(row, ['Total Usage', 'Usage', 'kWh', 'Consumption'])
        usage = parse_european_number(raw_usage)
            
        status = 'PENDING'
        notes = ''
        if not start_date or usage == 0.0:
            status = 'FLAGGED'
            notes = 'Auto-flagged: Could not parse dates or usage.'

        record = ESGRecord.objects.create(
            company=company, source=source, original_data=row,
            scope='SCOPE_2', category='Electricity', normalized_value=usage,
            normalized_unit='kWh', period_start=start_date, period_end=end_date,
            status=status, notes=notes
        )
        AuditLog.objects.create(record=record, action="Created via Utility Ingestion", new_state=row)
        records.append(record)
    return records

def process_concur_data(csv_file, company, source):
    records = []
    rows = extract_data_rows(csv_file.read())
    for row in rows:
        raw_distance = fuzzy_get(row, ['Distance', 'km', 'Miles'])
        distance = parse_european_number(raw_distance)
        
        # Concur data might have miles, let's normalize to km
        unit = 'km'
        if 'mile' in fuzzy_get(row, ['Unit', 'Distance']).lower():
            distance = distance * 1.60934
            
        status = 'PENDING'
        notes = ''
        if distance == 0.0:
            status = 'FLAGGED'
            notes = 'Auto-flagged: Invalid or missing distance.'

        record = ESGRecord.objects.create(
            company=company, source=source, original_data=row,
            scope='SCOPE_3', category='Business Travel - Flights',
            normalized_value=distance, normalized_unit=unit,
            status=status, notes=notes
        )
        AuditLog.objects.create(record=record, action="Created via Concur Ingestion", new_state=row)
        records.append(record)
    return records

def handle_ingestion(csv_file, company, source_type, source):
    if source_type == 'SAP':
        return process_sap_data(csv_file, company, source)
    elif source_type == 'UTILITY':
        return process_utility_data(csv_file, company, source)
    elif source_type == 'CONCUR':
        return process_concur_data(csv_file, company, source)
    else:
        raise ValueError("Invalid source type")

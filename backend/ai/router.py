"""
Department Router — Module B2
Static mapping: Category → Department with location sub-routing.
"""
from typing import Optional

# Primary category → department mapping
CATEGORY_DEPARTMENT_MAP = {
    "Wi-Fi":       "IT Services",
    "Classroom":   "Academic Affairs",
    "Laboratory":  "Laboratory Management",
    "Hostel":      "Warden Office",
    "Transport":   "Transport Office",
    "Washroom":    "Housekeeping & Sanitation",
    "Electrical":  "Electrical Maintenance",
    "Other":       "Administration",
}

# Location-based sub-routing for Hostel complaints
HOSTEL_BLOCK_WARDEN = {
    "Block A": "Warden Office — Block A (Mr. Sharma)",
    "Block B": "Warden Office — Block B (Ms. Priya)",
    "Block C": "Warden Office — Block C (Mr. Rajan)",
    "Block D": "Warden Office — Block D (Ms. Anita)",
}

# SLA hours by department
DEPARTMENT_SLA = {
    "IT Services": 24,
    "Electrical Maintenance": 12,
    "Warden Office": 48,
    "Academic Affairs": 72,
    "Laboratory Management": 48,
    "Transport Office": 24,
    "Housekeeping & Sanitation": 24,
    "Administration": 72,
}

def route(category: str, location_block: Optional[str] = None) -> dict:
    """
    Returns {department, sla_hours, contact_note}
    """
    dept = CATEGORY_DEPARTMENT_MAP.get(category, "Administration")

    # Location sub-routing
    if category == "Hostel" and location_block:
        sub = HOSTEL_BLOCK_WARDEN.get(location_block)
        if sub:
            dept = sub

    sla = DEPARTMENT_SLA.get(dept.split("—")[0].strip(), 72)

    return {
        "department": dept,
        "sla_hours": sla,
        "contact_note": f"Routed to {dept} — SLA: {sla}h",
    }

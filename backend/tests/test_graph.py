from app.ai.graph import ComplaintGraphRunner
from app.schemas.complaint import ComplaintFields


def test_new_complaint_extracts_demo_fields() -> None:
    result = ComplaintGraphRunner().run(
        message=(
            "Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg. "
            "Batch number AMX240602. Manufacturing date March 2026. Expiry date February 2028. "
            "Affected quantity 12 capsules."
        )
    )

    assert result.intent == "new_complaint"
    assert result.complaint.customer_name == "Apollo Pharmacy"
    assert result.complaint.batch_lot_number == "AMX240602"
    assert result.risk.severity == "Major"


def test_correction_only_changes_targeted_fields() -> None:
    current = ComplaintFields(
        customer_name="Apollo Pharmacy",
        product_name="Amoxicillin Capsules",
        batch_lot_number="AMX240602",
        affected_quantity="12 capsules",
    )

    result = ComplaintGraphRunner().run(
        message="ah sorry the batch number is BMX240602 and affected quantity is 48 capsules",
        current_complaint=current,
    )

    assert result.intent == "correction"
    assert result.complaint.batch_lot_number == "BMX240602"
    assert result.complaint.affected_quantity == "48 capsules"
    assert result.complaint.product_name == "Amoxicillin Capsules"
    assert set(result.updated_fields) == {"batch_lot_number", "affected_quantity"}


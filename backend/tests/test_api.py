from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_risk_endpoint_returns_structured_json() -> None:
    response = client.post(
        "/api/v1/risk",
        json={
            "complaint_source": "Email",
            "customer_name": "ABC Formulations Ltd.",
            "product_name": "Metformin Hydrochloride API",
            "product_strength": "IP/BP",
            "batch_lot_number": "MFH260712A",
            "affected_quantity": "25 kg (1 HDPE Drum)",
            "complaint_category": "Foreign Matter Contamination",
            "complaint_description": "Dark foreign particles observed inside a sealed HDPE drum.",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["severity"] == "Critical"
    assert 0 <= payload["confidence_score"] <= 1


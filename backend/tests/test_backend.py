import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "NEXORA"
    assert data["status"] == "online"

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "NEXORA"
    assert "ml_engine_enabled" in data

def test_hardware(client):
    response = client.get("/api/system/hardware")
    assert response.status_code == 200
    data = response.json()
    assert "device" in data
    assert "total_ram_gb" in data
    assert "cpu_cores_physical" in data

def test_models_catalog(client):
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    assert len(models) >= 4
    model_names = [m["name"] for m in models]
    assert "SmolLM2-360M-Instruct" in model_names
    assert "DistilGPT2" in model_names

def test_datasets(client):
    # Test listing seeded datasets
    response = client.get("/api/datasets")
    assert response.status_code == 200
    datasets = response.json()
    assert isinstance(datasets, list)
    assert len(datasets) >= 1

    ds_id = datasets[0]["id"]
    # Test get dataset
    res_get = client.get(f"/api/datasets/{ds_id}")
    assert res_get.status_code == 200
    detail = res_get.json()
    assert "preview" in detail
    assert "metadata" in detail

    # Test validate
    res_val = client.post(f"/api/datasets/{ds_id}/validate")
    assert res_val.status_code == 200
    val_data = res_val.json()
    assert "valid_samples" in val_data

    # Test split
    res_split = client.post(f"/api/datasets/{ds_id}/split", json={"train_ratio": 0.8, "val_ratio": 0.2, "seed": 42})
    assert res_split.status_code == 200
    split_data = res_split.json()
    assert split_data["status"] == "success"

def test_experiments_list(client):
    response = client.get("/api/experiments")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

import pytest
from starlette.testclient import TestClient
from .context import main

client = TestClient(main.app)


@pytest.fixture()
def no_data(monkeypatch):
    monkeypatch.setattr(main, 'iss_status', {})


def test_get_position_no_data():
    response = client.get("/iss/position")
    assert response.status_code == 200
    assert response.json() == {}


@pytest.fixture()
def mock_data(monkeypatch):
    monkeypatch.setattr(main, 'iss_status', {'latitude': 51.4, 'longitude': 34.4, 'is_illuminated': True})


def test_get_position_with_data(mock_data):
    response = client.get("/iss/position")
    assert response.status_code == 200
    assert response.json() == {'latitude': 51.4, 'longitude': 34.4, 'is_illuminated': True}

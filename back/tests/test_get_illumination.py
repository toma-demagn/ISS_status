import pytest
from starlette.testclient import TestClient
from .context import main
from datetime import datetime

client = TestClient(main.app)

# Mock data for testing
illuminations_time_windows = [
    ("2024-01-15T00:00:00", "2024-01-15T01:00:00"),
    ("2024-01-15T02:00:00", "2024-01-15T03:00:00"),
    ("2024-01-15T04:00:00", "2024-01-15T05:00:00"),
    ("2024-01-15T06:00:00", "2024-01-15T07:00:00"),
    ("2024-01-15T08:00:00", "2024-01-15T09:00:00"),
    ("2024-01-15T10:00:00", "2024-01-15T11:00:00"),
    ("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
    ("2024-01-15T14:00:00", "2024-01-15T15:00:00"),
    ("2024-01-15T16:00:00", "2024-01-15T17:00:00"),
    ("2024-01-15T18:00:00", "2024-01-15T19:00:00"),
    ("2024-01-15T20:00:00", "2024-01-15T21:00:00"),
    ("2024-01-15T22:00:00", "2024-01-15T23:00:00"),
]
window_start = datetime.fromisoformat("2024-01-16T00:00:00")
window_end = datetime.fromisoformat("2024-01-16T01:00:00")

DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT = 10


@pytest.fixture(autouse=True)
def mock_data(monkeypatch):
    monkeypatch.setattr(main, 'illuminations_time_windows', illuminations_time_windows)
    monkeypatch.setattr(main, 'window_start', window_start)
    monkeypatch.setattr(main, 'window_end', window_end)


def test_get_illumination_empty():
    response = client.get("/iss/illumination?limit=0")
    assert response.status_code == 200
    assert response.json() == []


def test_get_illumination_negative():
    response = client.get("/iss/illumination?limit=-1")
    assert response.status_code == 422  # Expecting an error status code because limit is negative


def test_get_illumination_large():
    response = client.get("/iss/illumination?limit=100")

    # the response is a list of string lists, so I need to convert my list into the right format
    full_time_windows = illuminations_time_windows + [(window_start.isoformat(), window_end.isoformat())]
    time_window_strings = [[start, end] for (start, end) in full_time_windows]

    assert response.status_code == 200
    assert response.json() == time_window_strings


def test_get_illumination_no_limit():
    response = client.get("/iss/illumination")
    assert response.status_code == 200
    assert len(response.json()) == DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT


def test_get_illumination_small():
    response = client.get("/iss/illumination?limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.fixture
def mock_data_same_start_end(monkeypatch):
    same_start_end = datetime.fromisoformat("2024-01-16T00:00:00")
    monkeypatch.setattr(main, 'illuminations_time_windows', illuminations_time_windows)
    monkeypatch.setattr(main, 'window_start', same_start_end)
    monkeypatch.setattr(main, 'window_end', same_start_end)
    monkeypatch.setattr(main, 'DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT', DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT)


def test_get_illumination_same_start_end(mock_data_same_start_end):
    response = client.get("/iss/illumination?limit=100")

    time_window_strings = [[start, end] for (start, end) in illuminations_time_windows]

    assert response.status_code == 200
    assert response.json() == time_window_strings


@pytest.fixture
def no_data(monkeypatch):
    monkeypatch.setattr(main, 'illuminations_time_windows', [])
    monkeypatch.setattr(main, 'window_start', datetime.min)
    monkeypatch.setattr(main, 'window_end', datetime.min)
    monkeypatch.setattr(main, 'DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT',
                        DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT)


def test_get_illumination_no_data():
    response = client.get("/iss/illumination?limit=0")
    assert response.status_code == 200
    assert response.json() == []

from freezegun import freeze_time
import json
import pytest
from .context import main

# dictionaries mapping line numbers to fixed datetimes
fixed_now_values = {
    64: "2024-01-15 12:00:00",
    91: "2024-01-15 13:00:00",
    110: "2024-01-15 14:00:00",
    138: "2024-01-15 15:00:00",
}

fixed_now_values_daylight = {
    1: "2024-01-15 12:00:00",
    27: "2024-01-15 13:00:00",
    46: "2024-01-15 14:00:00",
    74: "2024-01-15 15:00:00",
}

fixed_now_values_missing = {
    64: "2024-01-15 12:00:00",
    91: "2024-01-15 13:00:00",
    110: "2024-01-15 14:00:00",
    138: "2024-01-15 15:00:00",
}


@pytest.fixture(autouse=True)
def reset_illuminations(monkeypatch):
    monkeypatch.setattr(main, 'illuminations_time_windows', [])


def test_track_illumination_on_whole_file():
    with open('tests/data/iss_data.txt', 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values.get(line_number, "2024-01-15 12:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]


def test_track_illumination_starting_during_daylight():
    with open('tests/data/iss_data_daylight_start.txt', 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values_daylight.get(line_number, "2024-01-15 12:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]


def test_track_illumination_missing_values():
    with open('tests/data/iss_data_missing_values.txt', 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values_missing.get(line_number, "2024-01-15 12:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]

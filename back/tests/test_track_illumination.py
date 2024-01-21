import os
import json
import pytest
from .context import main
from freezegun import freeze_time

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

fixed_now_values_same_date = {
    65: "2024-01-15 12:00:00",
    66: "2024-01-15 12:00:00",
    85: "2024-01-15 14:00:00",
}

# getting the data directory's path
dir_path = os.path.dirname(os.path.realpath(__file__))
data_path = os.path.join(dir_path, 'data')


@pytest.fixture(autouse=True)
def reset_illuminations(monkeypatch):
    monkeypatch.setattr(main, 'illuminations_time_windows', [])

def test_track_illumination_on_whole_file():
    file_path = os.path.join(data_path, 'iss_data.txt')

    with open(file_path, 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values.get(line_number, "2024-01-15 11:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]

def test_track_illumination_starting_during_daylight():
    file_path = os.path.join(data_path, 'iss_data_daylight_start.txt')

    with open(file_path, 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values_daylight.get(line_number, "2024-01-15 11:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]

def test_track_illumination_missing_values():
    file_path = os.path.join(data_path, 'iss_data_missing_values.txt')

    with open(file_path, 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values_missing.get(line_number, "2024-01-15 11:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == [("2024-01-15T12:00:00", "2024-01-15T13:00:00"),
                                               ("2024-01-15T14:00:00", "2024-01-15T15:00:00")]


def test_track_illumination_same_date():
    file_path = os.path.join(data_path, 'iss_data_missing_values.txt')

    with open(file_path, 'r') as file:
        for line_number, line in enumerate(file, start=1):
            with freeze_time(fixed_now_values_same_date.get(line_number, "2024-01-15 11:00:00")):
                main.track_illumination(json.loads(line))

    assert main.illuminations_time_windows == []

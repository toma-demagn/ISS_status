import os
import json
import pytest
from .context import main, MAIN_PATH

# getting the data directory's path
dir_path = os.path.dirname(os.path.realpath(__file__))
data_path = os.path.join(dir_path, 'data')


@pytest.fixture(autouse=True)
def reset_illuminations(monkeypatch):
    monkeypatch.setattr(main, 'illuminations_time_windows', [])


def test_track_illumination_on_whole_file(mocker):
    file_path = os.path.join(data_path, 'iss_data.txt')

    with open(file_path, 'r') as file:
        for line in file:
            mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=json.loads(line))
            main.fetch_and_track()

    assert main.illuminations_time_windows == [('2024-01-20T14:52:48', '2024-01-20T15:46:49'),
                                               ('2024-01-20T16:24:49', '2024-01-20T17:20:49')]


def test_track_illumination_starting_during_daylight(mocker):
    file_path = os.path.join(data_path, 'iss_data_daylight_start.txt')

    with open(file_path, 'r') as file:
        for line in file:
            mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=json.loads(line))
            main.fetch_and_track()

    assert main.illuminations_time_windows == [('2024-01-20T14:54:49', '2024-01-20T15:46:49'),
                                               ('2024-01-20T16:24:49', '2024-01-20T17:20:49')]


def test_track_illumination_missing_values(mocker):
    file_path = os.path.join(data_path, 'iss_data_missing_values.txt')

    with open(file_path, 'r') as file:
        for line in file:
            mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=json.loads(line))
            main.fetch_and_track()

    assert main.illuminations_time_windows == [('2024-01-20T14:52:48', '2024-01-20T15:46:49'),
                                               ('2024-01-20T16:24:49', '2024-01-20T17:20:49')]


def test_track_illumination_same_date(mocker):
    file_path = os.path.join(data_path, 'iss_data_same_date.txt')

    with open(file_path, 'r') as file:
        for line in file:
            mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=json.loads(line))
            main.fetch_and_track()

    assert main.illuminations_time_windows == []

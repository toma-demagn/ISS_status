import pytest
from .context import main, MAIN_PATH


@pytest.fixture(autouse=True)
def reset_iss_status(monkeypatch):
    monkeypatch.setattr(main, 'iss_status', {
        'latitude': 48.0,
        'longitude': -0.7,
        'is_illuminated': True
    })


valid_mock_data = {'latitude': 3.5488158682935,
                   'longitude': -26.179545616384,
                   'visibility': 'daylight',
                   'timestamp': 1705766569
                   }

invalid_mock_data = {'latitude': 3.5488158682935,
                     'visibility': 'daylight',
                     'timestamp': 1705766569
                     }


def test_register_iss_status(mocker):
    mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=valid_mock_data)

    # calling register_iss_status with a new dictionary
    main.fetch_and_track()

    # Assert that iss_status was updated
    assert main.iss_status == {
        'latitude': 3.5488158682935,
        'longitude': -26.179545616384,
        'is_illuminated': True
    }


def test_register_iss_status_with_missing_fields(mocker):
    mocker.patch(f'{MAIN_PATH}.fetch_iss_data', return_value=invalid_mock_data)

    # calling register_iss_status but with a missing field
    main.fetch_and_track()

    # Assert that iss_status was not updated
    assert main.iss_status == {
        'latitude': 48.0,
        'longitude': -0.7,
        'is_illuminated': True
    }

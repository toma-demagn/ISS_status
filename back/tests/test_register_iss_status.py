import pytest
from .context import main


@pytest.fixture(autouse=True)
def reset_iss_status(monkeypatch):
    monkeypatch.setattr(main, 'iss_status', {
        'latitude': 48.0,
        'longitude': -0.7,
        'is_illuminated': True
    })


def test_register_iss_status():
    # calling register_iss_status with a new dictionary
    main.register_iss_status({
        'latitude': 50.0,
        'longitude': 0.3,
        'visibility': 'daylight'
    })

    # Assert that iss_status was not updated
    assert main.iss_status == {
        'latitude': 50.0,
        'longitude': 0.3,
        'is_illuminated': True
    }


def test_register_iss_status_with_missing_fields():
    # calling register_iss_status but with a missing field
    main.register_iss_status({
        'latitude': 50.0,
        'longitude': None,
        'visibility': 'daylight'
    })

    # Assert that iss_status was not updated
    assert main.iss_status == {
        'latitude': 48.0,
        'longitude': -0.7,
        'is_illuminated': True
    }

from datetime import datetime

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from apscheduler.schedulers.background import BackgroundScheduler

from utils import logger
from utils.logger import log

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# for storing the rolling API responses
iss_data = None

# list of time windows where the ISS was illuminated
illuminations_time_windows = []
DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT = 10

# variables to compute time windows
window_start, window_end = datetime.min, datetime.min

iss_status = {}


@app.get("/iss/illumination")
async def get_illumination(limit: int = Query(DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT)):
    windows = illuminations_time_windows + ([(window_start, window_end)] if (window_end - window_start).total_seconds() > 0 else [])
    # returning the last limit illumination times
    if limit == 0:
        # in the case limit = 0, windows[-limit:] would return the entire list
        return []
    else:
        return windows[-limit:]


@app.get("/iss/position")
async def get_position():
    return iss_status


def track_illumination(func):
    def wrapper(*args, **kwargs):
        prev_illumination_state = iss_status.get('is_illuminated', None)

        # Call the decorated function
        result = func(*args, **kwargs)
        global window_start
        global window_end
        curr_illumination_state = iss_status.get('is_illuminated', None)
        if not prev_illumination_state and curr_illumination_state or window_start == datetime.min:
            window_start = datetime.now()

        if iss_status.get('is_illuminated'):
            window_end = datetime.now()

        # total_seconds is used because seconds would give only the seconds part of the date diff
        if (window_end - window_start).total_seconds() > 0 and not curr_illumination_state:
            illuminations_time_windows.append((window_start, window_end))
            window_start, window_end = datetime.min, datetime.min
        print(curr_illumination_state, prev_illumination_state, (window_end - window_start).total_seconds() > 0,
              iss_status)
        return result

    return wrapper


def register_iss_status(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        # Update the 'latitude' and 'longitude' fields of the iss_status dictionary
        iss_status['latitude'] = result.get('latitude')
        iss_status['longitude'] = result.get('longitude')
        iss_status['is_illuminated'] = result.get('visibility') == 'daylight'
        return result

    return wrapper


@track_illumination
@register_iss_status
@log
def fetch_iss_data():
    global iss_data
    # Make a request to the external API
    iss_data = requests.get('https://api.wheretheiss.at/v1/satellites/25544').json()
    return iss_data


scheduler = BackgroundScheduler()
scheduler.add_job(fetch_iss_data, 'interval', seconds=20)
scheduler.start()

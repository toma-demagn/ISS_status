from datetime import datetime
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from .utils.logger import log

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# list of time windows where the ISS was illuminated
illuminations_time_windows = []
DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT = 10

# variables to compute time windows
window_start, window_end = datetime.min, datetime.min

iss_status = {}


@app.get("/iss/illumination")
async def get_illumination(limit: int = Query(DEFAULT_ILLUMINATION_TIME_WINDOWS_LIMIT, ge=0)):
    windows = illuminations_time_windows + (
        [(window_start.isoformat(), window_end.isoformat())] if (window_end - window_start).total_seconds() > 0 else [])
    # returning the last limit illumination times
    if limit == 0:
        # in the case limit = 0, windows[-limit:] would return the entire list
        return []
    else:
        return windows[-limit:]


@app.get("/iss/position")
async def get_position():
    return iss_status


def track_illumination(iss_data):
    visibility = iss_data.get('visibility', None)
    curr_illumination_state = False if visibility is None else visibility == 'daylight'
    global window_start, window_end
    if window_start == datetime.min and curr_illumination_state:
        window_start = datetime.now()

    if curr_illumination_state:
        window_end = datetime.now()

    # total_seconds is used because seconds would give only the seconds part of the date diff
    if (window_end - window_start).total_seconds() > 0 and not curr_illumination_state:
        illuminations_time_windows.append((window_start.isoformat(), window_end.isoformat()))
        window_start, window_end = datetime.min, datetime.min


def register_iss_status(iss_data):
    # update the fields if they are all in result
    if (iss_data.get('latitude') is not None and iss_data.get('longitude') is not None and
            iss_data.get('visibility') is not None):
        iss_status['latitude'] = iss_data.get('latitude')
        iss_status['longitude'] = iss_data.get('longitude')
        iss_status['is_illuminated'] = iss_data.get('visibility') == 'daylight'


def fetch_iss_data():
    # Make a request to the external API
    iss_data = requests.get('https://api.wheretheiss.at/v1/satellites/25544').json()
    return iss_data

@log
def fetch_and_track():
    result = fetch_iss_data()
    register_iss_status(result)
    track_illumination(result)


scheduler = BackgroundScheduler()
scheduler.add_job(fetch_and_track, 'interval', seconds=20)
scheduler.start()

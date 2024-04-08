from datetime import datetime
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from .utils.logger import log, debug
from pytz import utc
from .playground import genTLEPert

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

@app.get("/tle/norad/{norad}")
def get_tle(norad: int):
    tle = genTLEPert(norad)
    return {"line1": tle[0], "line2": tle[1]}

def track_illumination(visibility, timestamp):
    curr_illumination_state = visibility == 'daylight'
    global window_start, window_end
    if window_start == datetime.min and curr_illumination_state:
        window_start = datetime.fromtimestamp(timestamp)

    if curr_illumination_state:
        window_end = datetime.fromtimestamp(timestamp)

    if (window_end - window_start).total_seconds() > 0 and not curr_illumination_state:
        illuminations_time_windows.append((window_start.isoformat(), window_end.isoformat()))

    if not curr_illumination_state:
        window_start, window_end = datetime.min, datetime.min


def register_iss_status(latitude, longitude, visibility):
    iss_status['latitude'] = latitude
    iss_status['longitude'] = longitude
    iss_status['is_illuminated'] = visibility == 'daylight'


def fetch_iss_data():
    iss_data = requests.get('https://api.wheretheiss.at/v1/satellites/25544').json()
    return iss_data



@debug
def fetch_and_track():
    result = fetch_iss_data()
    if isinstance(result.get('latitude'), float) and isinstance(result.get('longitude'), float) and isinstance(
            result.get('timestamp'), int) and isinstance(result.get('visibility'), str):
        register_iss_status(result['latitude'], result['longitude'], result['visibility'])
        track_illumination(result['visibility'], result['timestamp'])


scheduler = BackgroundScheduler(timezone=utc)
scheduler.add_job(fetch_and_track, 'interval', seconds=20)
scheduler.start()

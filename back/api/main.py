from fastapi import FastAPI
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from utils.logger import log

app = FastAPI()

# for storing the rolling API responses
iss_data = None

# list of timestamps where the ISS was illuminated
illuminations_times = []
ILLUMINATION_TIMES_LIMIT = 10

iss_status = {}


@app.get("/iss/illumination")
async def get_illumination():
    # returning the last illumination times
    return illuminations_times[-ILLUMINATION_TIMES_LIMIT:]


@app.get("/iss/position")
async def get_position():
    return iss_status


def illumination(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        # Append the 'visibility' field of the response to the illuminations_times list
        if result.get('visibility') == 'daylight':
            illuminations_times.append(result.get('timestamp'))
        return result

    return wrapper


def position(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        # Update the 'latitude' and 'longitude' fields of the iss_status dictionary
        iss_status['latitude'] = result.get('latitude')
        iss_status['longitude'] = result.get('longitude')
        iss_status['is_illuminated'] = result.get('visibility') == 'daylight'
        return result

    return wrapper


@position
@illumination
@log
def fetch_iss_data():
    global iss_data
    # Make a request to the external API
    iss_data = requests.get('https://api.wheretheiss.at/v1/satellites/25544').json()
    return iss_data


scheduler = BackgroundScheduler()
scheduler.add_job(fetch_iss_data, 'interval', seconds=30)
scheduler.start()

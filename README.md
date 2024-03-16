# Project description

This webapp has a backend in the form of a FastAPI app. 
This backend exposes two entry points : `/iss/position` and `/iss/illumination` to retrieve the status of the ISS and the lats time windows when it was exposed to the sun.
The frontend is a ReactJS webapp showing a map of earth (made with Pigeon Map with Mapbox provider). The map shows the ISS position and hovering the ISS icon with the mouse reveals the last time windows exposed to the sun.

# How to run
## Run with docker

With docker running, open a terminal at the root of the project and run :

```console
docker-compose up
```
## Run without docker

### Run the backend
`cd` to directory `back` then 
```console
pip install -r requirements.txt
uvicorn api.main:app --reload
```
### Run the frontend
`cd` to directory `front` then 
```console
npm install
npm start
```


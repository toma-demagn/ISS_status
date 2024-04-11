# Project description

Web app showing a map of Earth with space objects. 

The map shows the ISS position and hovering the ISS icon with the mouse reveals the last time windows the ISS was exposed to the sun. The TLE (Two Line Elements) of the ISS is fetched hourly in order to draw its ground track. There is also two satellites which are displayed as well as a network of ground station. Hovering any of the satellites (except the ISS) reveals the next few ground station visibility. When a line is drawn between a satellite and a station, it means the satellite is within visibility of the ground station.

# How to run webapp
## Run with docker

With docker running, open a terminal at the root of the project and run :

```console
docker-compose up
```
## Run without docker

### Run the backend
`cd` to `\back` then:
```console
pip install -r requirements.txt
uvicorn api.main:app --reload
```
### Run the frontend
`cd` to `\front` then: 
```console
npm install
npm start
```
# How to run unit tests

Using a bash command line :
`cd` to `\back` then:
```console
chmod +x run_tests.sh
./run_tests.sh
```


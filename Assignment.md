# asl-250124

The solution must be pushed to Gitlab at least for **the day of the interview at 08:00am** so that we also have some time to prepare on our side.

## Code review - backend

The goal of the exercise is to create REST endpoints exposing the status of the International Space Station. This information can be retrieved of the ISS can be retrieved from https://api.wheretheiss.at/v1/satellites/25544. 

See https://wheretheiss.at/w/developer for more information. 

- The above API (wheretheiss.at) should be called not more than once every 20s, up to you to decide how to put that restriction in place. 
- The project should expose a GET resource at /iss/illumination that returns a list of time windows during which the ISS was exposed to the sun, until present time. 
- The project should expose a GET resource at /iss/position that returns the latitude and longitude of the ISS at present time and a boolean indicating if the ISS is exposed to the sun at this position.
- For persistence, in-memory storage is fine for now, but nothing stops you from using a proper database if you want to. 
- The code should be unit tested and a diagram should be produced to document the architecture of the solution. 

We recommend to use the following technologies for this exercise: Quarkus (Java) or FastAPI (Python), if not possible please justify.

## Code review - frontend

As an aerospace company, we work with a lot of geospatial data, that we display on interactive maps. In this exercise, we ask you to build a small interface to display the information coming from the backend of the previous exercise

- the information should be displayed to the user through a web interface displaying the earth with the free tier of Mapbox, OpenLayers, CesiumJS or any similar technology
- the current position of the ISS must be displayed as well as an indicator of whether it is exposed or not to the sun
- the known illumination time windows of the ISS, you can choose how to display the information (popup on hover, list on the side…) but it must be neat and clear.

We recommend to use the following technologies for this exercise: Vue or React or Angular for component design and Tailwind CSS for styling, if not possible please justify.

from sgp4.propagation import sgp4, sgp4init
from sgp4.api import Satrec, SatrecArray, SGP4_ERRORS, WGS72
from sgp4.exporter import export_tle
from random import random

def genTLEPert(satnum):
    bstar = 2.8098e-05+genRand()/10**6
    ndot = 6.96919666594958e-13
    nddot = 0.0
    ecco = 0.1859667
    argpo = 5.790416027488515+genRand()/10
    inclo = 0.5980929187319208+genRand()/10
    mo = 0.3373093125574321
    no_kozai = 0.04722944544077857
    nodeo = 6.08638547138321
    sat = Satrec()
    sat_jdepoch = 2451723.28495062
    sat.sgp4init(WGS72, 'i', satnum, sat_jdepoch, bstar, ndot, nddot,
                  ecco, argpo, inclo, mo, no_kozai, nodeo)
    return export_tle(sat)

def genRand():
    return random()*2-1

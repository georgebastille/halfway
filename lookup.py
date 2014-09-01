import sqlite3
import collections
import math

# Rotates a list l by n elements


def rotate(l, n):
    d = collections.deque(l)
    d.rotate(n)
    return list(d)

# Returns the abs diff between each element and each other element
# by making a copy, rotating the copy and subtracting, then repeating


def diffs(a):
    totDiff = 0
    for i in range(1, int(math.ceil(len(a) / 2.0)) + 1):
        b = rotate(a, i)
        diff = sum([abs(x - y) for x, y in zip(a, b)])
        totDiff += diff
    return totDiff


def lookup(entryPoints):
    print "Finding Halfway House for entry points: ", entryPoints

    conn = sqlite3.connect('halfway.db')

    # This next line converts the pesky unicode output from sqlite3 to a
    # string. Removes the u bit
    conn.text_factory = str

    # Construct Query String
    # String should look something like "SELECT STATIONB, WEIGHT FROM
    # fullRouteWeights WHERE STATIONA = 'VIC' OR STATIONA = 'SBC' OR
    # STATIONA = 'MGT' ORDER BY STATIONB"
    selectionString = "SELECT STATIONB, WEIGHT FROM fullRouteWeights WHERE "
    for station in entryPoints:
        selectionString += "STATIONA = '"
        selectionString += station
        selectionString += "' OR "

    # Remove last " OR "
    selectionString = selectionString[:-3]
    selectionString += "ORDER BY STATIONB"

    # With keyword, the Python interpreter automatically releases the
    # resources. It also provides error handling
    with conn:
        cur = conn.cursor()
        cur.execute(selectionString)
        rows = cur.fetchall()

    # Now we have a list like Vic 2, Vic 3, Vic 4, KX, 1, KX, 2 KX, 3
    # so we go through the list, comparing the name of the current element to the previous element
    # if they differ we take all the weights of the elements with the same name (e.g. Vic -> (2,3,4))
    # and calc the full difference between each weight and all the others
    # then we save the Name and this diff in another list and at the end we
    # sort it and take the top 4

    prevStation = ""

    weights = []
    vals = []
    for row in rows:
        if (row[0] == prevStation):
            weights.append(row[1])
        else:
            if (len(weights) > 0):
                # Add a zero weight if we are at one of the entry points
                # otherwise the difference matrix is skewed
                if (row[0] in entryPoints):
                    weights.append(0.0)
                current = (prevStation, sum(weights), diffs(weights))
                vals.append(current)

            prevStation = row[0]
            weights = []
            weights.append(row[1])

    if (len(weights) > 0):
        vals.append((prevStation, sum(weights), diffs(weights)))

    print "Top 4 locations by total + delta time"
    jizz = [(x[0], x[1] + x[2]) for x in vals]
    jizz.sort(key=lambda tup: tup[1])
    for val in jizz[:3]:
        print val
    return jizz[:3]


def neareststation(lat, lon):
    print "Start lookup for latitude:", lat, " longitude: ", lon
    querystr = """SELECT code, ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) AS dist FROM stations ORDER BY dist LIMIT 1"""

    conn = sqlite3.connect('halfway.db')
    with conn:
        cur = conn.cursor()
        cur.execute(querystr, (lat, lat, lon, lon))
        rows = cur.fetchall()
    print "Finished lookup, nearest station is ", rows[0][0]

    return rows[0][0]

def findstations(latlonvalues):
    stations = []
    for latlon in latlonvalues:
        stations.append(neareststation(latlon[0], latlon[1]))
    return stations

def reverselookup(stationcodes):
    conn = sqlite3.connect('halfway.db')
    querystr = """SELECT name, latitude, longitude FROM stations WHERE code = ? LIMIT 1"""
    stations = []

    with conn:
        cur = conn.cursor()
        for stationcode in stationcodes:
            cur.execute(querystr, (stationcode[0],))
            rows = cur.fetchall()
            station = []
            station.append(rows[0][0])
            station.append(rows[0][1])
            station.append(rows[0][2])
            stations.append(station)
    return stations


if __name__ == '__main__':
    stations = ["CFS", "RMD", "UXB"]
    print lookup(stations)
    print neareststation(51.5113621, -0.090236119)



#!/usr/bin/python

import BaseHTTPServer
import time
import os
import re
import cgi
import json
import sqlite3
import pprint
import collections
import math
from operator import add

# Rotates a list l by n elements
def rotate(l,n):
    d = collections.deque(l)
    d.rotate(n)
    return list(d)

# Returns the abs diff between each element and each other element
# by making a copy, rotating the copy and subtracting, then repeating
def diffs(a):
    totDiff = 0
    for i in range(1, int(math.ceil(len(a)/2.0)) + 1): 
        b = rotate(a, i)
        diff = sum([abs(x - y) for x, y in zip(a, b)])
        totDiff += diff
    return totDiff

class HalfwayLookup():

    def lookup(self, entryPoints):
        print type(entryPoints[0])
        print entryPoints[0]

        conn = sqlite3.connect('halfwayDB.db')

        ## This next line converts the pesky unicode output from sqlite3 to a string. Removes the u bit
        conn.text_factory = str


        # Construct Query String
        # String should look something like "SELECT STATIONB, WEIGHT FROM fullRouteWeights WHERE STATIONA = 'VIC' OR STATIONA = 'SBC' OR STATIONA = 'MGT' ORDER BY STATIONB"

        selectionString = "SELECT STATIONB, WEIGHT FROM fullRouteWeights WHERE "
        for station in entryPoints:
            print station
            selectionString += "STATIONA = '"
            selectionString += station
            selectionString += "' OR "

        # Remove last " OR "
        selectionString = selectionString[:-3]
        selectionString += "ORDER BY STATIONB"

        ## With keyword, the Python interpreter automatically releases the resources. It also provides error handling
        with conn:
            cur = conn.cursor()   
            cur.execute(selectionString)
            rows = cur.fetchall()
            print "rows = ", rows

        # Now we have a list like Vic 2, Vic 3, Vic 4, KX, 1, KX, 2 KX, 3
        # so we go through the list, comparing the name of the current element to the previous element
        # if they differ we take all the weights of the elements with the same name (e.g. Vic -> (2,3,4))
        # and calc the full difference between each weight and all the others
        # then we save the Name and this diff in another list and at the end we sort it and take the top 4

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


        print "Entry points: ", entryPoints

        print "Top 4 locations by fairness"
        vals.sort(key=lambda tup: tup[2])
        for val in vals[:4]:
            print val

        val2 = list(vals)

        print "Top 4 locations by total time"
        vals.sort(key=lambda tup: tup[1])
        for val in vals[:4]:
            print val

        wee = map(add, val2, vals)

        jizz = [(x[0], x[1] + x[2]) for x in vals]
        jizz.sort(key=lambda tup: tup[1])
        return jizz[:10]


HOST_NAME = '127.0.0.1' # !!!REMEMBER TO CHANGE THIS!!!
PORT_NUMBER = 9000 # Maybe set this to 9000.

class HalfwayHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_POST(self):
        if None != re.search('/api/v1/lookup', self.path):
            ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
            if ctype == 'application/json':
                length = int(self.headers.getheader('content-length'))
                dataJSON = cgi.parse_qs(self.rfile.read(length), keep_blank_values=1)

                values = json.loads(dataJSON.keys()[0])
                print type(values)
                print values
                lookup = HalfwayLookup()
                res = lookup.lookup(values)
                print res
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res))
            else:
                self.send_response(400, 'Bad Request: record does not exist')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
        else:
            self.send_response(403)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

        return

if __name__ == '__main__':
    server_class = BaseHTTPServer.HTTPServer
    httpd = server_class((HOST_NAME, PORT_NUMBER), HalfwayHandler)
    print time.asctime(), "Server Starts - %s:%s" % (HOST_NAME, PORT_NUMBER)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print time.asctime(), "Server Stops - %s:%s" % (HOST_NAME, PORT_NUMBER)




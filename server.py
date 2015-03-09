#!/usr/bin/python

import BaseHTTPServer
import socket
import SocketServer
import time
import re
import cgi
import json

# richie modules
import network
import lookup


HOST_NAME = network.mylanip()  # !!!REMEMBER TO CHANGE THIS!!!
PORT_NUMBER = 9000  # Maybe set this to 9000.

class MyTCPServer(SocketServer.TCPServer):
    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind(self.server_address)


class HalfwayHandler(BaseHTTPServer.BaseHTTPRequestHandler):

    def do_POST(self):
        if None != re.search('/api/v1/lookup', self.path):
            ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
            if ctype == 'application/json':
                length = int(self.headers.getheader('content-length'))
                dataJSON = cgi.parse_qs(self.rfile.read(length), keep_blank_values=1)

                latlonvalues = json.loads(dataJSON.keys()[0])
                stationcodes = lookup.findstations(latlonvalues)

                #stations = stationLookup(values)
                optimalstations = lookup.lookup(stationcodes)
                if not optimalstations:
                    self.send_response(400, 'Bad Request: no input stations')
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()

                optimallatlongs = lookup.reverselookup(optimalstations)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(optimallatlongs))
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
    httpd = MyTCPServer((HOST_NAME, PORT_NUMBER), HalfwayHandler)
    print time.asctime(), "Server Starts - %s:%s" % (HOST_NAME, PORT_NUMBER)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print time.asctime(), "Server Stops - %s:%s" % (HOST_NAME, PORT_NUMBER)

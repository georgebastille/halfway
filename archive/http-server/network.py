import socket
import fcntl
import struct

def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])


# Returns this machines ip on it's local lan
def mylanip():
    return get_ip_address('eth0')

# Returns this machines public ip address
# (may be the address of yout router)
# Currently not working, maybe try something with tracert
# and find the last hop with an internal address
# http://stackoverflow.com/a/613600
def mywanip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("gmail.com", 80))
    addr = s.getsockname()[0]
    s.close()
    return addr

if __name__ == '__main__':
    print "Local IP :", mylanip()
    print "Public IP:", mywanip()

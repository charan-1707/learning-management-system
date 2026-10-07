"""Dev file server for the LearnHub frontend (use instead of `python -m http.server`).

Sends `Cache-Control: no-store` on every response so browsers never run stale
JS after an update (stale scripts caused real bugs: mock/live mode mixups and
missing features). Serves E:/LearningManagementSystem/lms-frontend on port 8000.

Run:  python serve.py   (from E:\LearningManagementSystem)
Stop:  Ctrl+C
"""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lms-frontend')


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    # HTTP/1.1 keep-alive: reuses one connection for the ~25 files per page
    # instead of opening/closing a socket per file (churn + TIME_WAIT pile).
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass

    def do_GET(self):
        # Browsers always request /favicon.ico; serve our svg instead of 404.
        if self.path.split('?')[0] == '/favicon.ico':
            self.path = '/images/favicon.svg'
        return super().do_GET()


if __name__ == '__main__':
    # request_queue_size default is 5: rapid refreshes (~25 parallel file
    # requests, plus aborted/reopened sockets) overflowed the backlog and the
    # OS refused connections -> boot.js/dashboard.js ERR_CONNECTION_REFUSED
    # and half-loaded pages. 128 absorbs the burst; daemon threads so Ctrl+C
    # always stops the server.
    ThreadingHTTPServer.request_queue_size = 128
    ThreadingHTTPServer.daemon_threads = True
    with ThreadingHTTPServer(('0.0.0.0', 8000), NoCacheHandler) as httpd:
        print('LearnHub frontend at http://localhost:8000/ (LAN + no-cache dev server)')
        httpd.serve_forever()

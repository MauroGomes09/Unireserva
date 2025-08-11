import socket
import threading
import json
import ssl  
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

HOST = "127.0.0.1"
PORT = 5000

# Salas e reservas (poderia vir de um arquivo JSON)
rooms = json.load(open("rooms.json"))

lock = threading.Lock()

# Horários padrão permitidos
VALID_TIME_SLOTS = [
    "08:00-09:30",
    "09:45-11:15",
    "11:30-13:00",
    "13:15-14:45",
    "15:00-16:30",
    "16:45-18:15",
    "19:00-20:30",
    "20:45-22:15"
]

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            message = json.loads(post_data.decode())
            response = process_request(message)
            
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == '/salas':
            query = parse_qs(parsed_url.query)
            date = query.get('date', [None])[0]
            result = {}
            for room, reservas in rooms.items():
                if date:
                    reservas_filtradas = [r for r in reservas if r['date'] == date]
                    result[room] = reservas_filtradas
                else:
                    result[room] = reservas
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'rooms': result}).encode())
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

def process_request(msg):
    msg_type = msg.get("type")

    if msg_type == "REQ_LIST":
        return {"type": "RES_LIST", "rooms": list(rooms.keys())}

    elif msg_type == "REQ_LIST_ALL":
        return {"type": "RES_LIST_ALL", "rooms": rooms}

    elif msg_type == "REQ_BOOK":
        return book_room(msg)

    elif msg_type == "REQ_CHECK":
        return check_availability(msg)

    elif msg_type == "REQ_CANCEL":
        return cancel_reservation(msg)

    else:
        return {"type": "RES_ERROR", "error": "Tipo de mensagem desconhecido"}

def check_availability(msg):
    room = msg.get("room_id")
    date = msg.get("date")
    time_slot = msg.get("time_slot")

    if room not in rooms:
        return {"type": "RES_ERROR", "error": "Sala inexistente"}

    for reserva in rooms[room]:
        if reserva["date"] == date and reserva["time_slot"] == time_slot:
            return {"type": "RES_STATUS", "status": "indisponível"}

    return {"type": "RES_STATUS", "status": "disponível"}

def book_room(msg):
    room = msg.get("room_id")
    user = msg.get("user")
    date = msg.get("date")
    time_slot = msg.get("time_slot")

    if room not in rooms:
        return {"type": "RES_ERROR", "error": "Sala inexistente"}

    if time_slot not in VALID_TIME_SLOTS:
        return {"type": "RES_ERROR", "error": "Horário inválido"}

    with lock:
        for reserva in rooms[room]:
            if reserva["date"] == date and reserva["time_slot"] == time_slot:
                return {"type": "RES_ERROR", "error": "Conflito de horário"}

        rooms[room].append({
            "user": user,
            "date": date,
            "time_slot": time_slot
        })

        # Save to file
        with open("rooms.json", "w") as f:
            json.dump(rooms, f, indent=2)

    return {"type": "RES_CONFIRM", "room_id": room, "status": "confirmed"}

def cancel_reservation(msg):
    room = msg.get("room_id")
    user = msg.get("user")
    date = msg.get("date")
    time_slot = msg.get("time_slot")

    if room not in rooms:
        return {"type": "RES_ERROR", "error": "Sala inexistente"}

    with lock:
        for reserva in rooms[room]:
            if (reserva["user"] == user and reserva["date"] == date
                    and reserva["time_slot"] == time_slot):
                rooms[room].remove(reserva)
                
                # Save to file
                with open("rooms.json", "w") as f:
                    json.dump(rooms, f, indent=2)
                    
                return {"type": "RES_CANCEL", "status": "cancelled"}

    return {"type": "RES_ERROR", "error": "Reserva não encontrada"}

if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), RequestHandler)
    
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        
        context.load_cert_chain('server.crt', 'server.key')
        
        server.socket = context.wrap_socket(server.socket, server_side=True)
        
        print(f"[SERVIDOR] Iniciando HTTPS em {HOST}:{PORT}")
        print("[INFO] Servidor rodando com TLS/SSL ativado 🔒")
        
    except FileNotFoundError:
        print("[ERRO] Certificados não encontrados! Gerando certificados...")
        print("[INFO] Execute: openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes")
        print("[SERVIDOR] Iniciando em HTTP (sem TLS) em {HOST}:{PORT}")
        
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
    print("[SERVIDOR] Servidor encerrado")
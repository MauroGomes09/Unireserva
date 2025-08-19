import socket
import threading
import json
import ssl  
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

HOST = "0.0.0.0"  
PORT = 5000

rooms = json.load(open("rooms.json"))

lock = threading.Lock()

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

def get_local_ip():
    """Obtém o IP local da máquina"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "127.0.0.1"

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

    def log_message(self, format, *args):
        """Log customizado para mostrar qual cliente está acessando"""
        client_ip = self.client_address[0]
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {client_ip} - {format % args}")

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
    local_ip = get_local_ip()
    
    server = HTTPServer((HOST, PORT), RequestHandler)
    
    print("=" * 60)
    print("UNIRESERVA - SERVIDOR DE RESERVAS")
    print("=" * 60)
    
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('server.crt', 'server.key')
        server.socket = context.wrap_socket(server.socket, server_side=True)
        
        print(f"Servidor HTTPS iniciado!")
        print(f"Servidor local: https://{local_ip}:{PORT}")
        print(f"Localhost: https://127.0.0.1:{PORT}")
        print("\n Para acessar de outros dispositivos na rede:")
        print(f"   Use: https://{local_ip}:{PORT}")
        
    except FileNotFoundError:
        print(" Certificados SSL não encontrados!")
        print(" Para gerar certificados SSL, execute:")
        print("   openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes")
        print(f"\n Servidor HTTP iniciado (sem SSL)")
        print(f" Servidor local: http://{local_ip}:{PORT}")
        print(f" Localhost: http://127.0.0.1:{PORT}")
        print(f"\n Para acessar de outros dispositivos na rede:")
        print(f"   Use: http://{local_ip}:{PORT}")
    
    print("\n🔥 Servidor rodando... (Ctrl+C para parar)")
    print("📊 Logs de conexão:")
    print("-" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServidor encerrado pelo usuário")
    except Exception as e:
        print(f"\nErro no servidor: {e}")
    finally:
        server.server_close()
        print("Servidor finalizado")
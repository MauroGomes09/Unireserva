"""
Script para gerar certificados SSL automaticamente para o UniReserva
Uso: python setup_ssl.py
"""

import os
import subprocess
import sys

def check_openssl():
    """Verifica se openssl está disponível"""
    try:
        subprocess.run(['openssl', 'version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def generate_certificates():
    """Gera certificados SSL automaticamente"""
    cert_file = 'server.crt'
    key_file = 'server.key'
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print(f"[INFO] Certificados já existem: {cert_file}, {key_file}")
        return True
    
    if not check_openssl():
        print("[ERRO] OpenSSL não encontrado!")
        print("Windows: Instale Git Bash ou baixe OpenSSL")
        print("Ubuntu/Debian: sudo apt-get install openssl")
        print("Mac: brew install openssl")
        return False
    
    print("[INFO] Gerando certificados SSL...")
    
    cmd = [
        'openssl', 'req', '-x509', '-newkey', 'rsa:4096',
        '-keyout', key_file, '-out', cert_file,
        '-days', '365', '-nodes',
        '-subj', '/C=BR/ST=Rio Grande do Sul/L=Pelotas/O=UFPEL/OU=CDTec/CN=127.0.0.1'
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"[SUCCESS] Certificados gerados: {cert_file}, {key_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERRO] Falha ao gerar certificados: {e}")
        return False

def main():
    print("=== UniReserva - Setup SSL ===")
    print("Gerando certificados para desenvolvimento local...")
    
    if generate_certificates():
        print("\n[SUCCESS] Setup concluído!")
        print("Agora você pode rodar: python server.py")
        print("\nACESSO:")
        print("- Servidor: https://127.0.0.1:5000")
        print("- Frontend: https://localhost:3000")
        print("\nIMPORTANTE: Aceite os certificados no navegador!")
    else:
        print("\n[ERRO] Setup falhou. Verifique os requisitos.")
        sys.exit(1)

if __name__ == "__main__":
    main()
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import RoomSchedule from './components/RoomSchedule';
import { HORARIOS_PADRAO, formatHorario } from './constants';

interface Room {
  id: string;
  status?: string;
}

interface Reservation {
  user: string;
  date: string;
  time_slot: string;
}

const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; 
}

// Configuração do servidor - MUDE AQUI O IP DO SEU SERVIDOR
const getServerUrl = () => {
  // Você pode definir o IP do servidor aqui ou via variável de ambiente
  const serverIP = process.env.NEXT_PUBLIC_SERVER_IP || '192.168.1.100'; // MUDE ESTE IP
  const serverPort = process.env.NEXT_PUBLIC_SERVER_PORT || '5000';
  const useHTTPS = process.env.NEXT_PUBLIC_USE_HTTPS === 'true';
  
  return `${useHTTPS ? 'https' : 'http'}://${serverIP}:${serverPort}`;
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [date, setDate] = useState(getToday());
  const [timeSlot, setTimeSlot] = useState('');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roomReservations, setRoomReservations] = useState<Reservation[]>([]);
  const [serverUrl, setServerUrl] = useState('');
  const [customServerIp, setCustomServerIp] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Converter fetchRooms para useCallback para resolver o warning do ESLint
  const fetchRooms = useCallback(async (url = serverUrl) => {
    if (!url) return;
    
    setConnectionStatus('connecting');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'REQ_LIST' }),
      });
      const data = await response.json();
      if (data.rooms) {
        setRooms(data.rooms.map((id: string) => ({ id })));
        setConnectionStatus('connected');
        setMessage('');
      }
    } catch {
      setConnectionStatus('error');
      setMessage(`Erro ao conectar com o servidor ${url}. Verifique se o servidor está rodando e se o IP está correto.`);
    }
  }, [serverUrl]); // Incluir serverUrl como dependência

  useEffect(() => {
    const url = getServerUrl();
    setServerUrl(url);
    // Chamar fetchRooms diretamente com a URL ao invés de depender do state
    const initializeFetch = async () => {
      if (!url) return;
      
      setConnectionStatus('connecting');
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'REQ_LIST' }),
        });
        const data = await response.json();
        if (data.rooms) {
          setRooms(data.rooms.map((id: string) => ({ id })));
          setConnectionStatus('connected');
          setMessage('');
        }
      } catch {
        setConnectionStatus('error');
        setMessage(`Erro ao conectar com o servidor ${url}. Verifique se o servidor está rodando e se o IP está correto.`);
      }
    };
    
    initializeFetch();
  }, []); // Agora não precisa de dependências pois não usa fetchRooms

  // Limpar horário selecionado ao mudar sala ou data
  useEffect(() => {
    setTimeSlot('');
  }, [selectedRoom, date]);

  // Buscar reservas da sala/data selecionada
  useEffect(() => {
    if (!selectedRoom || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !serverUrl) {
      setRoomReservations([]);
      return;
    }
    fetch(`${serverUrl}/salas?date=${date}`)
      .then(res => res.json())
      .then(data => {
        const reservas = (data.rooms?.[selectedRoom] || []);
        setRoomReservations(reservas);
      })
      .catch(() => setRoomReservations([]));
  }, [selectedRoom, date, updateTrigger, serverUrl]);

  const horariosOcupados = roomReservations.map(r => r.time_slot);
  const horariosLivres = HORARIOS_PADRAO.filter(h => !horariosOcupados.includes(h));

  const connectToCustomServer = () => {
    if (!customServerIp.trim()) {
      setMessage('Digite um IP válido');
      return;
    }
    
    const protocol = customServerIp.includes('https://') || customServerIp.includes('http://') 
      ? '' 
      : 'http://';
    const port = customServerIp.includes(':') ? '' : ':5000';
    const newUrl = `${protocol}${customServerIp}${port}`;
    
    setServerUrl(newUrl);
    fetchRooms(newUrl);
  };

  const checkAvailability = async () => {
    if (!selectedRoom || !date || !timeSlot) {
      setMessage('Por favor, preencha todos os campos.');
      setSuccess(false);
      return;
    }
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'REQ_CHECK',
          room_id: selectedRoom,
          date,
          time_slot: timeSlot,
        }),
      });
      const data = await response.json();
      setMessage(`Sala ${selectedRoom} está ${data.status} para o horário selecionado.`);
      setSuccess(data.status === 'disponível');
    } catch {
      setMessage('Erro ao verificar disponibilidade.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const bookRoom = async () => {
    if (!selectedRoom || !date || !timeSlot || !userName) {
      setMessage('Por favor, preencha todos os campos.');
      setSuccess(false);
      return;
    }
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'REQ_BOOK',
          room_id: selectedRoom,
          user: userName,
          date,
          time_slot: timeSlot,
        }),
      });
      const data = await response.json();
      if (data.status === 'confirmed') {
        setMessage(`Reserva confirmada para sala ${selectedRoom}!`);
        setSuccess(true);
        setUpdateTrigger(prev => prev + 1);
        setSelectedRoom('');
        setTimeSlot('');
        setUserName('');
      } else {
        setMessage(data.error || 'Erro ao fazer reserva.');
        setSuccess(false);
      }
    } catch {
      setMessage('Erro ao fazer reserva.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>UNIRESERVA</h1>
        
        {/* Status de Conexão */}
        <div className={styles.card} style={{ marginBottom: 20 }}>
          <h3>🌐 Conexão com Servidor</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span>Status: </span>
            <span style={{ 
              color: connectionStatus === 'connected' ? 'green' : 
                     connectionStatus === 'error' ? 'red' : 'orange',
              fontWeight: 'bold'
            }}>
              {connectionStatus === 'connected' ? '🟢 Conectado' : 
               connectionStatus === 'error' ? '🔴 Erro' : '🟡 Conectando...'}
            </span>
          </div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            Servidor atual: <code>{serverUrl}</code>
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Ex: 192.168.1.100 ou 192.168.1.100:5000"
              value={customServerIp}
              onChange={(e) => setCustomServerIp(e.target.value)}
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button 
              onClick={connectToCustomServer}
              className={styles.button}
              style={{ background: '#4a90e2', color: 'white' }}
            >
              Conectar
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Reserva de Salas</h2>
            <div className={styles.formGroup}>
              <label>Sala:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className={styles.select}
                disabled={loading || connectionStatus !== 'connected'}
              >
                <option value="">Selecione uma sala</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.id}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
                disabled={loading || connectionStatus !== 'connected'}
                pattern="\d{4}-\d{2}-\d{2}"
                placeholder="YYYY-MM-DD"
                autoComplete="off"
                onClick={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.showPicker) {
                    input.showPicker();
                  }
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Horário:</label>
              {selectedRoom && date ? (
                horariosLivres.length > 0 ? (
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className={styles.select}
                    disabled={loading || connectionStatus !== 'connected'}
                  >
                    <option value="">Selecione um horário</option>
                    {horariosLivres.map((horario) => (
                      <option key={horario} value={horario}>
                        {formatHorario(horario)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.message} style={{marginTop: 8}}>
                    Nenhum horário disponível para esta sala e data.
                  </div>
                )
              ) : (
                <div className={styles.message} style={{marginTop: 8}}>
                  Selecione sala e data primeiro.
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Nome:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={styles.input}
                placeholder="Seu nome"
                disabled={loading || connectionStatus !== 'connected'}
              />
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={checkAvailability}
                className={styles.button}
                disabled={loading || horariosLivres.length === 0 || connectionStatus !== 'connected'}
                style={{ background: '#3182ce', color: 'white', fontWeight: 600 }}
              >
                {loading ? 'Verificando...' : 'Verificar Disponibilidade'}
              </button>
              <button
                onClick={bookRoom}
                className={`${styles.button} ${styles.primary}`}
                disabled={loading || horariosLivres.length === 0 || connectionStatus !== 'connected'}
                style={{ background: '#2b6cb0', color: 'white', fontWeight: 600 }}
              >
                {loading ? 'Reservando...' : 'Reservar Sala'}
              </button>
            </div>
            {message && (
              <div
                className={success ? styles.successMessage : styles.message}
                style={{ marginTop: 16 }}
              >
                {message}
              </div>
            )}
          </div>
          <RoomSchedule 
            key={updateTrigger} 
            updateTrigger={updateTrigger}
          />
        </div>
      </div>
    </main>
  );
}
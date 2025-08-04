'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roomReservations, setRoomReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  // Limpar horário selecionado ao mudar sala ou data
  useEffect(() => {
    setTimeSlot('');
  }, [selectedRoom, date]);

  // Buscar reservas da sala/data selecionada
  useEffect(() => {
    if (!selectedRoom || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setRoomReservations([]);
      return;
    }
    fetch(`http://127.0.0.1:5000/salas?date=${date}`)
      .then(res => res.json())
      .then(data => {
        const reservas = (data.rooms?.[selectedRoom] || []);
        setRoomReservations(reservas);
      })
      .catch(() => setRoomReservations([]));
  }, [selectedRoom, date, updateTrigger]);

  const horariosOcupados = roomReservations.map(r => r.time_slot);
  const horariosLivres = HORARIOS_PADRAO.filter(h => !horariosOcupados.includes(h));

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'REQ_LIST' }),
      });
      const data = await response.json();
      if (data.rooms) {
        setRooms(data.rooms.map((id: string) => ({ id })));
      }
    } catch {
      setMessage('Erro ao carregar salas. Verifique se o servidor está rodando.');
    }
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
      const response = await fetch('http://127.0.0.1:5000', {
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
      const response = await fetch('http://127.0.0.1:5000', {
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
        setDate('');
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
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Reserva de Salas</h2>
            <div className={styles.formGroup}>
              <label>Sala:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className={styles.select}
                disabled={loading}
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
                disabled={loading}
                pattern="\d{4}-\d{2}-\d{2}"
                placeholder="YYYY-MM-DD"
                autoComplete="off"
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
                    disabled={loading}
                  >
                    <option value="">Selecione um horário</option>
                    {horariosLivres.map((horario) => (
                      <option key={horario} value={horario}>
                        {formatHorario(horario)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.message} style={{marginTop: 8}}>Nenhum horário disponível para esta sala e data.</div>
                )
              ) : (
                <div className={styles.message} style={{marginTop: 8}}>Selecione sala e data primeiro.</div>
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
                disabled={loading}
              />
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={checkAvailability}
                className={styles.button}
                disabled={loading || horariosLivres.length === 0}
                style={{ background: '#3182ce', color: 'white', fontWeight: 600 }}
              >
                {loading ? 'Verificando...' : 'Verificar Disponibilidade'}
              </button>
              <button
                onClick={bookRoom}
                className={`${styles.button} ${styles.primary}`}
                disabled={loading || horariosLivres.length === 0}
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
          <RoomSchedule key={updateTrigger} updateTrigger={updateTrigger} />
        </div>
        </div>
      </main>
  );
}
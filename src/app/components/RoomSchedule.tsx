import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { HORARIOS_PADRAO, formatHorario } from '../constants';

interface Reservation {
  user: string;
  date: string;
  time_slot: string;
}

interface RoomData {
  [key: string]: Reservation[];
}

interface RoomScheduleProps {
  updateTrigger?: number;
}

export default function RoomSchedule({ updateTrigger }: RoomScheduleProps) {
  const [roomData, setRoomData] = useState<RoomData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [inputDate, setInputDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Busca só quando clicar em buscar ou pressionar Enter
  const fetchRooms = (date: string) => {
    setLoading(true);
    fetch(`https://127.0.0.1:5000/salas?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setRoomData(data.rooms || {});
        setError('');
      })
      .catch(() => setError('Erro ao carregar horários das salas.'))
      .finally(() => setLoading(false));
  };

  // Buscar ao montar ou updateTrigger
  useEffect(() => {
    fetchRooms(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTrigger]);

  const handleBuscar = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      setSelectedDate(inputDate);
      fetchRooms(inputDate);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBuscar();
    }
  };

  const formatDate = (date: string) => {
    const [yyyy, mm, dd] = date.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const getStatus = (sala: string, horario: string) => {
    const reservas = roomData[sala] || [];
    const reserva = reservas.find(
      (r) => r.time_slot === horario
    );
    if (reserva) return { status: 'reservado', user: reserva.user };
    return { status: 'livre' };
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const salas = Object.keys(roomData);

  return (
    <div className={styles.scheduleContainer}>
      <h2 className={styles.scheduleTitle}>Horários das Salas</h2>
      <div className={styles.dateSelector}>
        <form style={{display:'inline'}} onSubmit={handleBuscar}>
          <label htmlFor="date-input">Selecione a data: </label>
          <input
            id="date-input"
            type="date"
            value={inputDate}
            onChange={e => setInputDate(e.target.value)}
            className={styles.input}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => {
                  const input = e.target as HTMLInputElement;
                  if ( input.showPicker) {
                    input.showPicker();
                  }
                }}
          />
          <button
            type="submit"
            className={styles.button}
            style={{ marginLeft: 8, background: '#3182ce', color: 'white', fontWeight: 600, padding: '0.5rem 1.2rem' }}
            onClick={handleBuscar}
          >
            Buscar
          </button>
        </form>
        <div className={styles.selectedDate}>
          Data selecionada: {formatDate(selectedDate)}
        </div>
      </div>
      <div className={styles.roomCardList}>
        {salas.map((sala) => (
          <div key={sala} className={styles.roomSimpleCard}>
            <div className={styles.roomSimpleTitle}>{sala}</div>
            <div className={styles.roomSimpleHorarios}>
              {HORARIOS_PADRAO.map((horario) => {
                const status = getStatus(sala, horario);
                return (
                  <div
                    key={horario}
                    className={
                      status.status === 'reservado'
                        ? styles.horarioChipReservado
                        : styles.horarioChipLivre
                    }
                    title={status.status === 'reservado' ? `Reservado por: ${status.user}` : 'Disponível'}
                  >
                    <span className={styles.horarioChipHora}>{formatHorario(horario)}</span>
                    <span className={styles.horarioChipStatus}>
                      {status.status === 'reservado'
                        ? `Reservado por ${status.user}`
                        : 'Livre'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// constants.js ou constants.ts

export const HORARIOS_PADRAO = [
  "08:00-09:30",
  "09:45-11:15", 
  "11:30-13:00",
  "13:15-14:45",
  "15:00-16:30",
  "16:45-18:15",
  "19:00-20:30",
  "20:45-22:15"
];

export const formatHorario = (horario: string) => {
  return horario; // Pode adicionar formatação customizada aqui se necessário
};

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto', 
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const formatarData = (dataISO: string) => {
  const data = new Date(dataISO + 'T00:00:00');
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0'); 
  const ano = data.getFullYear();
  const diaSemana = DIAS_SEMANA[data.getDay()];
  
  return `${diaSemana}, ${dia}/${mes}/${ano}`;
};
export const HORARIOS_PADRAO = [
  "08:00-09:30",
  "09:45-11:15",
  "11:30-13:00",
  "13:15-14:45",
  "15:00-16:30",
  "16:45-18:15",
  "19:00-20:30",
  "20:45-22:15"
] as const;

export type HorarioPadrao = typeof HORARIOS_PADRAO[number];

export const formatHorario = (horario: string) => {
  const [inicio, fim] = horario.split('-');
  return `${inicio} - ${fim}`;
};
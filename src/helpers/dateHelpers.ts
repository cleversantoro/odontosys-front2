// src/helpers/dateHelpers.ts

// Formato ISO padrão
export const formatToISO = (date: Date): string => {
  return date.toISOString();
};

// Formato: dd/MM/yyyy HH:mm:ss
export const formatToBR = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });
};

// export const formatToBRShort = (date: Date): string => {
//   return date.toLocaleString('pt-BR', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//     hour12: false,
//     timeZone: 'America/Sao_Paulo',
//   });
// };

export function formatDateBrShort(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Formato: yyyy-MM-dd HH:mm:ss
export const formatToSQL = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

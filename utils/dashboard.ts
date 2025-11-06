export const getLastMonths = () => {
  const currentDate = new Date();
  const monthsArray = [];

  for (let i = 0; i <= 11; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const monthName = date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
    const capitalizedMonth =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    monthsArray.push({
      value: date.getMonth() + 1,
      label: capitalizedMonth,
    });
  }

  return monthsArray;
};

export const getCategoriesForMonth = (
  year: number,
  month: number
): string[] => {
  const categories: string[] = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  let currentDate = new Date(startDate);

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceFirstDay = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
  };

  while (currentDate < endDate) {
    const weekNumber = getWeekNumber(currentDate);
    const weekName = `Semana ${weekNumber}`;
    categories.push(weekName);

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return categories;
};

/*

categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
        ],
*/
// devuelve un arreglo con los nombres de los meses del año actual hasta el mes actual
export const getMonthNamesUpToCurrent = (): string[] => {
  const monthNames: string[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  for (let i = 0; i <= currentMonth; i++) {
    const date = new Date(currentDate.getFullYear(), i, 1);
    const monthName = date.toLocaleDateString("es-ES", { month: "short" });
    monthNames.push(monthName);
  }

  return monthNames;
};

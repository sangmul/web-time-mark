import type { ScheduleConfig, ScheduleRow } from "../types";
import { addDays, dayName, isSameCalendarDate, parseDDMMYYYY } from "./date";

const WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

export function generateSchedule(config: ScheduleConfig): ScheduleRow[] {
  const from = parseDDMMYYYY(config.fromDate);
  const to = parseDDMMYYYY(config.toDate);
  if (!from || !to || from > to) return [];

  const otherHolidays = config.otherHolidayDates
    .split(",")
    .map((value) => parseDDMMYYYY(value.trim()))
    .filter((value): value is Date => value !== null);

  const rows: ScheduleRow[] = [];
  let cursor = from;
  let no = 1;

  while (cursor <= to) {
    const weekday = cursor.getDay();

    if (weekday !== config.holidayWeekday) {
      const isOtherHoliday = otherHolidays.some((holiday) =>
        isSameCalendarDate(holiday, cursor),
      );
      const isWeekendShift =
        WEEKEND_DAYS.includes(weekday) && weekday !== config.holidayWeekday;

      rows.push({
        id: `${cursor.getTime()}`,
        no,
        date: cursor,
        dayName: dayName(cursor),
        isWeekendShift,
        isOtherHoliday,
        status: isOtherHoliday ? "libur" : isWeekendShift ? "shift-we" : "siap",
        photoMasuk: null,
        photoPulang: null,
        resultMasuk: null,
        resultPulang: null,
        resultPhotoMasuk: null,
        resultPhotoPulang: null,
      });
      no += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return rows;
}

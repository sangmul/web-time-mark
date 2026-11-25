import type { ScheduleConfig, ScheduleRow } from "../types";
import {
  addDays,
  dayName,
  isSameCalendarDate,
  parseDDMMYYYY,
  parseDateList,
} from "./date";

const WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

export function generateSchedule(config: ScheduleConfig): ScheduleRow[] {
  const from = parseDDMMYYYY(config.fromDate);
  const to = parseDDMMYYYY(config.toDate);
  if (!from || !to || from > to) return [];

  // WFH dates get no photo row (they appear as WFH rows in the PDF).
  const skipped = [
    ...parseDateList(config.otherHolidayDates),
    ...parseDateList(config.wfhDates),
  ];

  const rows: ScheduleRow[] = [];
  let cursor = from;
  let no = 1;

  while (cursor <= to) {
    const weekday = cursor.getDay();

    const isOtherHoliday = skipped.some((holiday) =>
      isSameCalendarDate(holiday, cursor),
    );

    if (weekday !== config.holidayWeekday && !isOtherHoliday) {
      const isWeekendShift =
        WEEKEND_DAYS.includes(weekday) && weekday !== config.holidayWeekday;

      rows.push({
        id: `${cursor.getTime()}`,
        no,
        date: cursor,
        dayName: dayName(cursor),
        isWeekendShift,
        status: isWeekendShift ? "shift-we" : "siap",
        photoMasuk: null,
        photoPulang: null,
        resultMasuk: null,
        resultPulang: null,
        resultMasukAt: null,
        resultPulangAt: null,
        resultPhotoMasuk: null,
        resultPhotoPulang: null,
      });
      no += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return rows;
}

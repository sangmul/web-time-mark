export type RowStatus = "siap" | "shift-we" | "libur";

export interface PhotoUpload {
  fileName: string;
  url: string;
}

export interface ScheduleRow {
  id: string;
  no: number;
  date: Date;
  dayName: string;
  isWeekendShift: boolean;
  isOtherHoliday: boolean;
  status: RowStatus;
  photoMasuk: PhotoUpload | null;
  photoPulang: PhotoUpload | null;
  resultMasuk: string | null;
  resultPulang: string | null;
  resultPhotoMasuk: string | null;
  resultPhotoPulang: string | null;
}

export interface ScheduleConfig {
  fromDate: string; // dd-mm-yyyy
  toDate: string; // dd-mm-yyyy
  holidayWeekday: number; // 0=Sunday ... 6=Saturday
  otherHolidayDates: string; // comma separated dd-mm-yyyy
  jamMasuk: string;
  selisihMasuk: number;
  autoJamPulang: string;
  selisihPulang: number;
  coordinate: string;
}

import dayjs from "dayjs";

export function dayjsDate(date, format = "DD MMM YYYYг") {
  return dayjs(date).locale("ru").format(format);
}

export function dayjsDateTime(date, format = "HH:mm DD MMM YYYYг") {
  return dayjs(date).locale("ru").format(format);
}

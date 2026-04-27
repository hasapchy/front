export const PHONE_COUNTRIES = [
  {
    id: "tm",
    code: "+993",
    dialCode: "993",
    name: "Туркменистан",
    flag: "/flags/640px-Flag_of_Turkmenistan.svg.png",
    mask: "\\9\\9\\3 99 999999",
    placeholder: "993 12 345678",
    localLength: 8,
  },
  {
    id: "ru",
    code: "+7",
    dialCode: "7",
    name: "Россия",
    flag: "/flags/640px-Flag_of_Russia.svg.webp",
    mask: "\\7 (999) 999-99-99",
    placeholder: "7 (999) 999-99-99",
    localLength: 10,
  },
  {
    id: "kz",
    code: "+7",
    dialCode: "7",
    name: "Казахстан",
    flag: "/flags/Flag_of_Kazakhstan.svg.png",
    mask: "\\7 (999) 999-99-99",
    placeholder: "7 (777) 123-45-67",
    localLength: 10,
  },
  {
    id: "ae",
    code: "+971",
    dialCode: "971",
    name: "Дубай (ОАЭ)",
    flag: "/flags/Flag_of_the_United_Arab_Emirates.svg.png",
    mask: "\\9\\7\\1 99 999 9999",
    placeholder: "971 50 123 4567",
    localLength: 9,
  },
  {
    id: "tr",
    code: "+90",
    dialCode: "90",
    name: "Турция",
    flag: "/flags/Flag_of_Turkey.svg.png",
    mask: "\\9\\0 999 999 99 99",
    placeholder: "90 532 123 45 67",
    localLength: 10,
  },
];

export const DEFAULT_PHONE_COUNTRY_ID = "tm";

const PHONE_COUNTRIES_BY_ID = Object.fromEntries(
  PHONE_COUNTRIES.map((country) => [country.id, country]),
);

export function getCountryById(countryId) {
  return PHONE_COUNTRIES_BY_ID[countryId];
}

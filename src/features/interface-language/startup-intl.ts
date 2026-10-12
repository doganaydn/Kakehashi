// Hermes may supply NumberFormat/DateTimeFormat without these newer Intl APIs.
// Load prerequisites before plural-rule detection, which itself uses Intl.Locale.
import "@formatjs/intl-getcanonicallocales/polyfill";
import "@formatjs/intl-locale/polyfill";
import "@formatjs/intl-pluralrules/polyfill";
import "@formatjs/intl-pluralrules/locale-data/en";
import "@formatjs/intl-pluralrules/locale-data/tr";

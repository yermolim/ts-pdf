export interface charEncodingInfo {
  name: string; 
  char: string; 
  stdCode: number;
  macCode: number; 
  winCode: number; 
  pdfCode: number;
  utfCode: number;
};

export const pdfCharCodesByName: {[key: string]: charEncodingInfo} = {
  A: {
    name: "A",
    char: "A",
    stdCode: 65,
    macCode: 65,
    winCode: 65,
    pdfCode: 65,
    utfCode: 65
  },
  AE: {
    name: "AE",
    char: "Æ",
    stdCode: 225,
    macCode: 174,
    winCode: 198,
    pdfCode: 198,
    utfCode: 198
  },
  Aacute: {
    name: "Aacute",
    char: "Á",
    stdCode: null,
    macCode: 231,
    winCode: 193,
    pdfCode: 193,
    utfCode: 193
  },
  Acircumflex: {
    name: "Acircumflex",
    char: "Â",
    stdCode: null,
    macCode: 229,
    winCode: 194,
    pdfCode: 194,
    utfCode: 194
  },
  Adieresis: {
    name: "Adieresis",
    char: "Ä",
    stdCode: null,
    macCode: 128,
    winCode: 196,
    pdfCode: 196,
    utfCode: 196
  },
  Agrave: {
    name: "Agrave",
    char: "À",
    stdCode: null,
    macCode: 203,
    winCode: 192,
    pdfCode: 192,
    utfCode: 192
  },
  Aring: {
    name: "Aring",
    char: "Å",
    stdCode: null,
    macCode: 129,
    winCode: 197,
    pdfCode: 197,
    utfCode: 197
  },
  Atilde: {
    name: "Atilde",
    char: "Ã",
    stdCode: null,
    macCode: 204,
    winCode: 195,
    pdfCode: 195,
    utfCode: 195
  },
  B: {
    name: "B",
    char: "B",
    stdCode: 66,
    macCode: 66,
    winCode: 66,
    pdfCode: 66,
    utfCode: 66
  },
  C: {
    name: "C",
    char: "C",
    stdCode: 67,
    macCode: 67,
    winCode: 67,
    pdfCode: 67,
    utfCode: 67
  },
  Ccedilla: {
    name: "Ccedilla",
    char: "Ç",
    stdCode: null,
    macCode: 130,
    winCode: 199,
    pdfCode: 199,
    utfCode: 199
  },
  D: {
    name: "D",
    char: "D",
    stdCode: 68,
    macCode: 68,
    winCode: 68,
    pdfCode: 68,
    utfCode: 68
  },
  E: {
    name: "E",
    char: "E",
    stdCode: 69,
    macCode: 69,
    winCode: 69,
    pdfCode: 69,
    utfCode: 69
  },
  Eacute: {
    name: "Eacute",
    char: "É",
    stdCode: null,
    macCode: 131,
    winCode: 201,
    pdfCode: 201,
    utfCode: 201
  },
  Ecircumflex: {
    name: "Ecircumflex",
    char: "Ê",
    stdCode: null,
    macCode: 230,
    winCode: 202,
    pdfCode: 202,
    utfCode: 202
  },
  Edieresis: {
    name: "Edieresis",
    char: "Ë",
    stdCode: null,
    macCode: 232,
    winCode: 203,
    pdfCode: 203,
    utfCode: 203
  },
  Egrave: {
    name: "Egrave",
    char: "È",
    stdCode: null,
    macCode: 233,
    winCode: 200,
    pdfCode: 200,
    utfCode: 200
  },
  Eth: {
    name: "Eth",
    char: "Ð",
    stdCode: null,
    macCode: null,
    winCode: 208,
    pdfCode: 208,
    utfCode: 208
  },
  Euro: {
    name: "Euro",
    char: "€",
    stdCode: null,
    macCode: null,
    winCode: 128,
    pdfCode: 160,
    utfCode: 8364,
  },
  F: {
    name: "F",
    char: "F",
    stdCode: 70,
    macCode: 70,
    winCode: 70,
    pdfCode: 70,
    utfCode: 70
  },
  G: {
    name: "G",
    char: "G",
    stdCode: 71,
    macCode: 71,
    winCode: 71,
    pdfCode: 71,
    utfCode: 71
  },
  H: {
    name: "H",
    char: "H",
    stdCode: 72,
    macCode: 72,
    winCode: 72,
    pdfCode: 72,
    utfCode: 72
  },
  I: {
    name: "I",
    char: "I",
    stdCode: 73,
    macCode: 73,
    winCode: 73,
    pdfCode: 73,
    utfCode: 73
  },
  Iacute: {
    name: "Iacute",
    char: "Í",
    stdCode: null,
    macCode: 234,
    winCode: 205,
    pdfCode: 205,
    utfCode: 205
  },
  Icircumflex: {
    name: "Icircumflex",
    char: "Î",
    stdCode: null,
    macCode: 235,
    winCode: 206,
    pdfCode: 206,
    utfCode: 206
  },
  Idieresis: {
    name: "Idieresis",
    char: "Ï",
    stdCode: null,
    macCode: 236,
    winCode: 207,
    pdfCode: 207,
    utfCode: 207
  },
  Igrave: {
    name: "Igrave",
    char: "Ì",
    stdCode: null,
    macCode: 237,
    winCode: 204,
    pdfCode: 204,
    utfCode: 204
  },
  J: {
    name: "J",
    char: "J",
    stdCode: 74,
    macCode: 74,
    winCode: 74,
    pdfCode: 74,
    utfCode: 74
  },
  K: {
    name: "K",
    char: "K",
    stdCode: 75,
    macCode: 75,
    winCode: 75,
    pdfCode: 75,
    utfCode: 75
  },
  L: {
    name: "L",
    char: "L",
    stdCode: 76,
    macCode: 76,
    winCode: 76,
    pdfCode: 76,
    utfCode: 76
  },
  Lslash: {
    name: "Lslash",
    char: "Ł",
    stdCode: 232,
    macCode: null,
    winCode: null,
    pdfCode: 149,
    utfCode: 321
  },
  M: {
    name: "M",
    char: "M",
    stdCode: 77,
    macCode: 77,
    winCode: 77,
    pdfCode: 77,
    utfCode: 77
  },
  N: {
    name: "N",
    char: "N",
    stdCode: 78,
    macCode: 78,
    winCode: 78,
    pdfCode: 78,
    utfCode: 78
  },
  Ntilde: {
    name: "Ntilde",
    char: "Ñ",
    stdCode: null,
    macCode: 132,
    winCode: 209,
    pdfCode: 209,
    utfCode: 209
  },
  O: {
    name: "O",
    char: "O",
    stdCode: 79,
    macCode: 79,
    winCode: 79,
    pdfCode: 79,
    utfCode: 79
  },
  OE: {
    name: "OE",
    char: "OE",
    stdCode: 234,
    macCode: 206,
    winCode: 140,
    pdfCode: 150,
    utfCode: 338
  },
  Oacute: {
    name: "Oacute",
    char: "Ó",
    stdCode: null,
    macCode: 238,
    winCode: 211,
    pdfCode: 211,
    utfCode: 211
  },
  Ocircumflex: {
    name: "Ocircumflex",
    char: "Ô",
    stdCode: null,
    macCode: 239,
    winCode: 212,
    pdfCode: 212,
    utfCode: 212
  },
  Odieresis: {
    name: "Odieresis",
    char: "Ö",
    stdCode: null,
    macCode: 133,
    winCode: 214,
    pdfCode: 214,
    utfCode: 214
  },
  Ograve: {
    name: "Ograve",
    char: "Ò",
    stdCode: null,
    macCode: 241,
    winCode: 210,
    pdfCode: 210,
    utfCode: 210
  },
  Oslash: {
    name: "Oslash",
    char: "Ø",
    stdCode: 233,
    macCode: 175,
    winCode: 216,
    pdfCode: 216,
    utfCode: 216
  },
  Otilde: {
    name: "Otilde",
    char: "Õ",
    stdCode: null,
    macCode: 205,
    winCode: 213,
    pdfCode: 213,
    utfCode: 213
  },
  P: {
    name: "P",
    char: "P",
    stdCode: 80,
    macCode: 80,
    winCode: 80,
    pdfCode: 80,
    utfCode: 80
  },
  Q: {
    name: "Q",
    char: "Q",
    stdCode: 81,
    macCode: 81,
    winCode: 81,
    pdfCode: 81,
    utfCode: 81
  },
  R: {
    name: "R",
    char: "R",
    stdCode: 82,
    macCode: 82,
    winCode: 82,
    pdfCode: 82,
    utfCode: 82
  },
  S: {
    name: "S",
    char: "S",
    stdCode: 83,
    macCode: 83,
    winCode: 83,
    pdfCode: 83,
    utfCode: 83
  },
  Scaron: {
    name: "Scaron",
    char: "Š",
    stdCode: null,
    macCode: null,
    winCode: 138,
    pdfCode: 151,
    utfCode: 352
  },
  T: {
    name: "T",
    char: "T",
    stdCode: 84,
    macCode: 84,
    winCode: 84,
    pdfCode: 84,
    utfCode: 84
  },
  Thorn: {
    name: "Thorn",
    char: "Þ",
    stdCode: null,
    macCode: null,
    winCode: 222,
    pdfCode: 222,
    utfCode: 222
  },
  U: {
    name: "U",
    char: "U",
    stdCode: 85,
    macCode: 85,
    winCode: 85,
    pdfCode: 85,
    utfCode: 85
  },
  Uacute: {
    name: "Uacute",
    char: "Ú",
    stdCode: null,
    macCode: 242,
    winCode: 218,
    pdfCode: 218,
    utfCode: 218
  },
  Ucircumflex: {
    name: "Ucircumflex",
    char: "Û",
    stdCode: null,
    macCode: 243,
    winCode: 219,
    pdfCode: 219,
    utfCode: 219
  },
  Udieresis: {
    name: "Udieresis",
    char: "Ü",
    stdCode: null,
    macCode: 134,
    winCode: 220,
    pdfCode: 220,
    utfCode: 220
  },
  Ugrave: {
    name: "Ugrave",
    char: "Ù",
    stdCode: null,
    macCode: 244,
    winCode: 217,
    pdfCode: 217,
    utfCode: 217
  },
  V: {
    name: "V",
    char: "V",
    stdCode: 86,
    macCode: 86,
    winCode: 86,
    pdfCode: 86,
    utfCode: 86
  },
  W: {
    name: "W",
    char: "W",
    stdCode: 87,
    macCode: 87,
    winCode: 87,
    pdfCode: 87,
    utfCode: 87
  },
  X: {
    name: "X",
    char: "X",
    stdCode: 88,
    macCode: 88,
    winCode: 88,
    pdfCode: 88,
    utfCode: 88
  },
  Y: {
    name: "Y",
    char: "Y",
    stdCode: 89,
    macCode: 89,
    winCode: 89,
    pdfCode: 89,
    utfCode: 89
  },
  Yacute: {
    name: "Yacute",
    char: "Ý",
    stdCode: null,
    macCode: null,
    winCode: 221,
    pdfCode: 221,
    utfCode: 221
  },
  Ydieresis: {
    name: "Ydieresis",
    char: "Ÿ",
    stdCode: null,
    macCode: 217,
    winCode: 159,
    pdfCode: 152,
    utfCode: 376
  },
  Z: {
    name: "Z",
    char: "Z",
    stdCode: 90,
    macCode: 90,
    winCode: 90,
    pdfCode: 90,
    utfCode: 90
  },
  Zcaron: {
    name: "Zcaron",
    char: "Ž",
    stdCode: null,
    macCode: null,
    winCode: 142,
    pdfCode: 153,
    utfCode: 381
  },
  a: {
    name: "a",
    char: "a",
    stdCode: 97,
    macCode: 97,
    winCode: 97,
    pdfCode: 97,
    utfCode: 97
  },
  aacute: {
    name: "aacute",
    char: "á",
    stdCode: null,
    macCode: 135,
    winCode: 225,
    pdfCode: 225,
    utfCode: 225
  },
  acircumflex: {
    name: "acircumflex",
    char: "â",
    stdCode: null,
    macCode: 137,
    winCode: 226,
    pdfCode: 226,
    utfCode: 226
  },
  acute: {
    name: "acute",
    char: "´",
    stdCode: 194,
    macCode: 171,
    winCode: 180,
    pdfCode: 180,
    utfCode: 180
  },
  adieresis: {
    name: "adieresis",
    char: "ä",
    stdCode: null,
    macCode: 138,
    winCode: 228,
    pdfCode: 228,
    utfCode: 228
  },
  ae: {
    name: "ae",
    char: "æ",
    stdCode: 241,
    macCode: 190,
    winCode: 230,
    pdfCode: 230,
    utfCode: 230
  },
  agrave: {
    name: "agrave",
    char: "à",
    stdCode: null,
    macCode: 136,
    winCode: 224,
    pdfCode: 224,
    utfCode: 224
  },
  ampersand: {
    name: "ampersand",
    char: "&",
    stdCode: 38,
    macCode: 38,
    winCode: 38,
    pdfCode: 38,
    utfCode: 38
  },
  aring: {
    name: "aring",
    char: "å",
    stdCode: null,
    macCode: 140,
    winCode: 229,
    pdfCode: 229,
    utfCode: 229
  },
  asciicircum: {
    name: "asciicircum",
    char: "^",
    stdCode: 94,
    macCode: 94,
    winCode: 94,
    pdfCode: 94,
    utfCode: 94
  },
  asciitilde: {
    name: "asciitilde",
    char: "~",
    stdCode: 126,
    macCode: 126,
    winCode: 126,
    pdfCode: 126,
    utfCode: 126
  },
  asterisk: {
    name: "asterisk",
    char: "*",
    stdCode: 42,
    macCode: 42,
    winCode: 42,
    pdfCode: 42,
    utfCode: 42
  },
  at: {
    name: "at",
    char: "@",
    stdCode: 64,
    macCode: 64,
    winCode: 64,
    pdfCode: 64,
    utfCode: 64
  },
  atilde: {
    name: "atilde",
    char: "ã",
    stdCode: null,
    macCode: 139,
    winCode: 227,
    pdfCode: 227,
    utfCode: 227
  },
  b: {
    name: "b",
    char: "b",
    stdCode: 98,
    macCode: 98,
    winCode: 98,
    pdfCode: 98,
    utfCode: 98
  },
  backslash: {
    name: "backslash",
    char: "\"",
    stdCode: 92,
    macCode: 92,
    winCode: 92,
    pdfCode: 92,
    utfCode: 92
  },
  bar: {
    name: "bar",
    char: "|",
    stdCode: 124,
    macCode: 124,
    winCode: 124,
    pdfCode: 124,
    utfCode: 124
  },
  braceleft: {
    name: "braceleft",
    char: "{",
    stdCode: 123,
    macCode: 123,
    winCode: 123,
    pdfCode: 123,
    utfCode: 123
  },
  braceright: {
    name: "braceright",
    char: "}",
    stdCode: 125,
    macCode: 125,
    winCode: 125,
    pdfCode: 125,
    utfCode: 125
  },
  bracketleft: {
    name: "bracketleft",
    char: "[",
    stdCode: 91,
    macCode: 91,
    winCode: 91,
    pdfCode: 91,
    utfCode: 91
  },
  bracketright: {
    name: "bracketright",
    char: "]",
    stdCode: 93,
    macCode: 93,
    winCode: 93,
    pdfCode: 93,
    utfCode: 93
  },
  breve: {
    name: "breve",
    char: "˘",
    stdCode: 198,
    macCode: 249,
    winCode: null,
    pdfCode: 24,
    utfCode: 728
  },
  brokenbar: {
    name: "brokenbar",
    char: "¦",
    stdCode: null,
    macCode: null,
    winCode: 166,
    pdfCode: 166,
    utfCode: 166
  },
  bullet: {
    name: "bullet",
    char: "•",
    stdCode: 183,
    macCode: 165,
    winCode: 149,
    pdfCode: 128,
    utfCode: 8226
  },
  c: {
    name: "c",
    char: "c",
    stdCode: 99,
    macCode: 99,
    winCode: 99,
    pdfCode: 99,
    utfCode: 99
  },
  caron: {
    name: "caron",
    char: "ˇ",
    stdCode: 207,
    macCode: 255,
    winCode: null,
    pdfCode: 25,
    utfCode: 711
  },
  ccedilla: {
    name: "ccedilla",
    char: "ç",
    stdCode: null,
    macCode: 141,
    winCode: 231,
    pdfCode: 231,
    utfCode: 231
  },
  cedilla: {
    name: "cedilla",
    char: "¸",
    stdCode: 203,
    macCode: 252,
    winCode: 184,
    pdfCode: 184,
    utfCode: 184
  },
  cent: {
    name: "cent",
    char: "¢",
    stdCode: 162,
    macCode: 162,
    winCode: 162,
    pdfCode: 162,
    utfCode: 162
  },
  circumflex: {
    name: "circumflex",
    char: "ˆ",
    stdCode: 195,
    macCode: 246,
    winCode: 136,
    pdfCode: 26,
    utfCode: 710
  },
  colon: {
    name: "colon",
    char: ":",
    stdCode: 58,
    macCode: 58,
    winCode: 58,
    pdfCode: 58,
    utfCode: 58
  },
  comma: {
    name: "comma",
    char: ",",
    stdCode: 44,
    macCode: 44,
    winCode: 44,
    pdfCode: 44,
    utfCode: 44
  },
  copyright: {
    name: "copyright",
    char: "©",
    stdCode: null,
    macCode: 169,
    winCode: 169,
    pdfCode: 169,
    utfCode: 169
  },
  currency1: {
    name: "currency1",
    char: "¤",
    stdCode: 168,
    macCode: 219,
    winCode: 164,
    pdfCode: 164,
    utfCode: 164
  },
  d: {
    name: "d",
    char: "d",
    stdCode: 100,
    macCode: 100,
    winCode: 100,
    pdfCode: 100,
    utfCode: 100
  },
  dagger: {
    name: "dagger",
    char: "†",
    stdCode: 178,
    macCode: 160,
    winCode: 134,
    pdfCode: 129,
    utfCode: 8224
  },
  daggerdbl: {
    name: "daggerdbl",
    char: "‡",
    stdCode: 179,
    macCode: 224,
    winCode: 135,
    pdfCode: 130,
    utfCode: 8225
  },
  degree: {
    name: "degree",
    char: "°",
    stdCode: null,
    macCode: 161,
    winCode: 176,
    pdfCode: 176,
    utfCode: 176
  },
  dieresis: {
    name: "dieresis",
    char: "¨",
    stdCode: 200,
    macCode: 172,
    winCode: 168,
    pdfCode: 168,
    utfCode: 168
  },
  divide: {
    name: "divide",
    char: "÷",
    stdCode: null,
    macCode: 214,
    winCode: 247,
    pdfCode: 247,
    utfCode: 247
  },
  dollar: {
    name: "dollar",
    char: "$",
    stdCode: 36,
    macCode: 36,
    winCode: 36,
    pdfCode: 36,
    utfCode: 36
  },
  dotaccent: {
    name: "dotaccent",
    char: "˙",
    stdCode: 199,
    macCode: 250,
    winCode: null,
    pdfCode: 27,
    utfCode: 729
  },
  dotlessi: {
    name: "dotlessi",
    char: "ı",
    stdCode: 245,
    macCode: 245,
    winCode: null,
    pdfCode: 154,
    utfCode: 305
  },
  e: {
    name: "e",
    char: "e",
    stdCode: 101,
    macCode: 101,
    winCode: 101,
    pdfCode: 101,
    utfCode: 101
  },
  eacute: {
    name: "eacute",
    char: "é",
    stdCode: null,
    macCode: 142,
    winCode: 233,
    pdfCode: 233,
    utfCode: 233
  },
  ecircumflex: {
    name: "ecircumflex",
    char: "ê",
    stdCode: null,
    macCode: 144,
    winCode: 234,
    pdfCode: 234,
    utfCode: 234
  },
  edieresis: {
    name: "edieresis",
    char: "ë",
    stdCode: null,
    macCode: 145,
    winCode: 235,
    pdfCode: 235,
    utfCode: 235
  },
  egrave: {
    name: "egrave",
    char: "è",
    stdCode: null,
    macCode: 143,
    winCode: 232,
    pdfCode: 232,
    utfCode: 232
  },
  eight: {
    name: "eight",
    char: "8",
    stdCode: 56,
    macCode: 56,
    winCode: 56,
    pdfCode: 56,
    utfCode: 56
  },
  ellipsis: {
    name: "ellipsis",
    char: "…",
    stdCode: 188,
    macCode: 201,
    winCode: 133,
    pdfCode: 131,
    utfCode: 8230
  },
  emdash: {
    name: "emdash",
    char: "—",
    stdCode: 208,
    macCode: 209,
    winCode: 151,
    pdfCode: 132,
    utfCode: 8212
  },
  endash: {
    name: "endash",
    char: "–",
    stdCode: 177,
    macCode: 208,
    winCode: 150,
    pdfCode: 133,
    utfCode: 8211
  },
  equal: {
    name: "equal",
    char: "=",
    stdCode: 61,
    macCode: 61,
    winCode: 61,
    pdfCode: 61,
    utfCode: 61
  },
  eth: {
    name: "eth",
    char: "ð",
    stdCode: null,
    macCode: null,
    winCode: 240,
    pdfCode: 240,
    utfCode: 240
  },
  exclam: {
    name: "exclam",
    char: "!",
    stdCode: 33,
    macCode: 33,
    winCode: 33,
    pdfCode: 33,
    utfCode: 33
  },
  exclamdown: {
    name: "exclamdown",
    char: "¡",
    stdCode: 161,
    macCode: 193,
    winCode: 161,
    pdfCode: 161,
    utfCode: 161
  },
  f: {
    name: "f",
    char: "f",
    stdCode: 102,
    macCode: 102,
    winCode: 102,
    pdfCode: 102,
    utfCode: 102
  },
  fi: {
    name: "fi",
    char: "fi",
    stdCode: 174,
    macCode: 222,
    winCode: null,
    pdfCode: 147,
    utfCode: 64257
  },
  five: {
    name: "five",
    char: "5",
    stdCode: 53,
    macCode: 53,
    winCode: 53,
    pdfCode: 53,
    utfCode: 53
  },
  fl: {
    name: "fl",
    char: "fl",
    stdCode: 175,
    macCode: 223,
    winCode: null,
    pdfCode: 148,
    utfCode: 64258
  },
  florin: {
    name: "florin",
    char: "ƒ",
    stdCode: 166,
    macCode: 196,
    winCode: 131,
    pdfCode: 134,
    utfCode: 402
  },
  four: {
    name: "four",
    char: "4",
    stdCode: 52,
    macCode: 52,
    winCode: 52,
    pdfCode: 52,
    utfCode: 52
  },
  fraction: {
    name: "fraction",
    char: "⁄",
    stdCode: 164,
    macCode: 218,
    winCode: null,
    pdfCode: 135,
    utfCode: 8260
  },
  g: {
    name: "g",
    char: "g",
    stdCode: 103,
    macCode: 103,
    winCode: 103,
    pdfCode: 103,
    utfCode: 103
  },
  germandbls: {
    name: "germandbls",
    char: "ß",
    stdCode: 251,
    macCode: 167,
    winCode: 223,
    pdfCode: 223,
    utfCode: 223
  },
  grave: {
    name: "grave",
    char: "`",
    stdCode: 193,
    macCode: 96,
    winCode: 96,
    pdfCode: 96,
    utfCode: 96
  },
  greater: {
    name: "greater",
    char: ">",
    stdCode: 62,
    macCode: 62,
    winCode: 62,
    pdfCode: 62,
    utfCode: 62
  },
  guillemotleft: {
    name: "guillemotleft",
    char: "«",
    stdCode: 171,
    macCode: 199,
    winCode: 171,
    pdfCode: 171,
    utfCode: 171
  },
  guillemotright: {
    name: "guillemotright",
    char: "»",
    stdCode: 187,
    macCode: 200,
    winCode: 187,
    pdfCode: 187,
    utfCode: 187
  },
  guilsinglleft: {
    name: "guilsinglleft",
    char: "‹",
    stdCode: 172,
    macCode: 220,
    winCode: 139,
    pdfCode: 136,
    utfCode: 8249
  },
  guilsinglright: {
    name: "guilsinglright",
    char: "›",
    stdCode: 173,
    macCode: 221,
    winCode: 155,
    pdfCode: 137,
    utfCode: 8250
  },
  h: {
    name: "h",
    char: "h",
    stdCode: 104,
    macCode: 104,
    winCode: 104,
    pdfCode: 104,
    utfCode: 104
  },
  hungarumlaut: {
    name: "hungarumlaut",
    char: "˝",
    stdCode: 205,
    macCode: 253,
    winCode: null,
    pdfCode: 28,
    utfCode: 733
  },
  hyphen: {
    name: "hyphen",
    char: "-",
    stdCode: 45,
    macCode: 45,
    winCode: 45,
    pdfCode: 45,
    utfCode: 45
  },
  i: {
    name: "i",
    char: "i",
    stdCode: 105,
    macCode: 105,
    winCode: 105,
    pdfCode: 105,
    utfCode: 105
  },
  iacute: {
    name: "iacute",
    char: "í",
    stdCode: null,
    macCode: 146,
    winCode: 237,
    pdfCode: 237,
    utfCode: 237
  },
  icircumflex: {
    name: "icircumflex",
    char: "î",
    stdCode: null,
    macCode: 148,
    winCode: 238,
    pdfCode: 238,
    utfCode: 238
  },
  idieresis: {
    name: "idieresis",
    char: "ï",
    stdCode: null,
    macCode: 149,
    winCode: 239,
    pdfCode: 239,
    utfCode: 239
  },
  igrave: {
    name: "igrave",
    char: "ì",
    stdCode: null,
    macCode: 147,
    winCode: 236,
    pdfCode: 236,
    utfCode: 236
  },
  j: {
    name: "j",
    char: "j",
    stdCode: 106,
    macCode: 106,
    winCode: 106,
    pdfCode: 106,
    utfCode: 106
  },
  k: {
    name: "k",
    char: "k",
    stdCode: 107,
    macCode: 107,
    winCode: 107,
    pdfCode: 107,
    utfCode: 107
  },
  l: {
    name: "l",
    char: "l",
    stdCode: 108,
    macCode: 108,
    winCode: 108,
    pdfCode: 108,
    utfCode: 108
  },
  less: {
    name: "less",
    char: "<",
    stdCode: 60,
    macCode: 60,
    winCode: 60,
    pdfCode: 60,
    utfCode: 60
  },
  logicalnot: {
    name: "logicalnot",
    char: "¬",
    stdCode: null,
    macCode: 194,
    winCode: 172,
    pdfCode: 172,
    utfCode: 172
  },
  lslash: {
    name: "lslash",
    char: "ł",
    stdCode: 248,
    macCode: null,
    winCode: null,
    pdfCode: 155,
    utfCode: 322
  },
  m: {
    name: "m",
    char: "m",
    stdCode: 109,
    macCode: 109,
    winCode: 109,
    pdfCode: 109,
    utfCode: 109
  },
  macron: {
    name: "macron",
    char: "¯",
    stdCode: 197,
    macCode: 248,
    winCode: 175,
    pdfCode: 175,
    utfCode: 175
  },
  minus: {
    name: "minus",
    char: "−",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: 138,
    utfCode: 8722
  },
  mu: {
    name: "mu",
    char: "μ",
    stdCode: null,
    macCode: 181,
    winCode: 181,
    pdfCode: 181,
    utfCode: 181
  },
  multiply: {
    name: "multiply",
    char: "×",
    stdCode: null,
    macCode: null,
    winCode: 215,
    pdfCode: 215,
    utfCode: 215
  },
  n: {
    name: "n",
    char: "n",
    stdCode: 110,
    macCode: 110,
    winCode: 110,
    pdfCode: 110,
    utfCode: 110
  },
  nine: {
    name: "nine",
    char: "9",
    stdCode: 57,
    macCode: 57,
    winCode: 57,
    pdfCode: 57,
    utfCode: 57
  },
  ntilde: {
    name: "ntilde",
    char: "ñ",
    stdCode: null,
    macCode: 150,
    winCode: 241,
    pdfCode: 241,
    utfCode: 241
  },
  numbersign: {
    name: "numbersign",
    char: "#",
    stdCode: 35,
    macCode: 35,
    winCode: 35,
    pdfCode: 35,
    utfCode: 35
  },
  o: {
    name: "o",
    char: "o",
    stdCode: 111,
    macCode: 111,
    winCode: 111,
    pdfCode: 111,
    utfCode: 111
  },
  oacute: {
    name: "oacute",
    char: "ó",
    stdCode: null,
    macCode: 151,
    winCode: 243,
    pdfCode: 243,
    utfCode: 243
  },
  ocircumflex: {
    name: "ocircumflex",
    char: "ô",
    stdCode: null,
    macCode: 153,
    winCode: 244,
    pdfCode: 244,
    utfCode: 244
  },
  odieresis: {
    name: "odieresis",
    char: "ö",
    stdCode: null,
    macCode: 154,
    winCode: 246,
    pdfCode: 246,
    utfCode: 246
  },
  oe: {
    name: "oe",
    char: "oe",
    stdCode: 250,
    macCode: 207,
    winCode: 156,
    pdfCode: 156,
    utfCode: 339
  },
  ogonek: {
    name: "ogonek",
    char: "˛",
    stdCode: 206,
    macCode: 254,
    winCode: null,
    pdfCode: 29,
    utfCode: 731
  },
  ograve: {
    name: "ograve",
    char: "ò",
    stdCode: null,
    macCode: 152,
    winCode: 242,
    pdfCode: 242,
    utfCode: 242
  },
  one: {
    name: "one",
    char: "1",
    stdCode: 49,
    macCode: 49,
    winCode: 49,
    pdfCode: 49,
    utfCode: 49
  },
  onehalf: {
    name: "onehalf",
    char: "½",
    stdCode: null,
    macCode: null,
    winCode: 189,
    pdfCode: 189,
    utfCode: 189
  },
  onequarter: {
    name: "onequarter",
    char: "¼",
    stdCode: null,
    macCode: null,
    winCode: 188,
    pdfCode: 188,
    utfCode: 188
  },
  onesuperior: {
    name: "onesuperior",
    char: "¹",
    stdCode: null,
    macCode: null,
    winCode: 185,
    pdfCode: 185,
    utfCode: 185
  },
  ordfeminine: {
    name: "ordfeminine",
    char: "ª",
    stdCode: 227,
    macCode: 187,
    winCode: 170,
    pdfCode: 170,
    utfCode: 170
  },
  ordmasculine: {
    name: "ordmasculine",
    char: "º",
    stdCode: 235,
    macCode: 188,
    winCode: 186,
    pdfCode: 186,
    utfCode: 186
  },
  oslash: {
    name: "oslash",
    char: "ø",
    stdCode: 249,
    macCode: 191,
    winCode: 248,
    pdfCode: 248,
    utfCode: 248
  },
  otilde: {
    name: "otilde",
    char: "õ",
    stdCode: null,
    macCode: 155,
    winCode: 245,
    pdfCode: 245,
    utfCode: 245
  },
  p: {
    name: "p",
    char: "p",
    stdCode: 112,
    macCode: 112,
    winCode: 112,
    pdfCode: 112,
    utfCode: 112
  },
  paragraph: {
    name: "paragraph",
    char: "¶",
    stdCode: 182,
    macCode: 166,
    winCode: 182,
    pdfCode: 182,
    utfCode: 182
  },
  parenleft: {
    name: "parenleft",
    char: "(",
    stdCode: 40,
    macCode: 40,
    winCode: 40,
    pdfCode: 40,
    utfCode: 40
  },
  parenright: {
    name: "parenright",
    char: ")",
    stdCode: 41,
    macCode: 41,
    winCode: 41,
    pdfCode: 41,
    utfCode: 41
  },
  percent: {
    name: "percent",
    char: "%",
    stdCode: 37,
    macCode: 37,
    winCode: 37,
    pdfCode: 37,
    utfCode: 37
  },
  period: {
    name: "period",
    char: ".",
    stdCode: 46,
    macCode: 46,
    winCode: 46,
    pdfCode: 46,
    utfCode: 46
  },
  periodcentered: {
    name: "periodcentered",
    char: "·",
    stdCode: 180,
    macCode: 225,
    winCode: 183,
    pdfCode: 183,
    utfCode: 183
  },
  perthousand: {
    name: "perthousand",
    char: "‰",
    stdCode: 189,
    macCode: 228,
    winCode: 137,
    pdfCode: 139,
    utfCode: 8240
  },
  plus: {
    name: "plus",
    char: "+",
    stdCode: 43,
    macCode: 43,
    winCode: 43,
    pdfCode: 43,
    utfCode: 43
  },
  plusminus: {
    name: "plusminus",
    char: "±",
    stdCode: null,
    macCode: 177,
    winCode: 177,
    pdfCode: 177,
    utfCode: 177
  },
  q: {
    name: "q",
    char: "q",
    stdCode: 113,
    macCode: 113,
    winCode: 113,
    pdfCode: 113,
    utfCode: 113
  },
  question: {
    name: "question",
    char: "?",
    stdCode: 63,
    macCode: 63,
    winCode: 63,
    pdfCode: 63,
    utfCode: 63
  },
  questiondown: {
    name: "questiondown",
    char: "¿",
    stdCode: 191,
    macCode: 192,
    winCode: 191,
    pdfCode: 191,
    utfCode: 191
  },
  quotedbl: {
    name: "quotedbl",
    char: "\"",
    stdCode: 34,
    macCode: 34,
    winCode: 34,
    pdfCode: 34,
    utfCode: 34
  },
  quotedblbase: {
    name: "quotedblbase",
    char: "„",
    stdCode: 185,
    macCode: 227,
    winCode: 132,
    pdfCode: 140,
    utfCode: 8222
  },
  quotedblleft: {
    name: "quotedblleft",
    char: "“",
    stdCode: 170,
    macCode: 210,
    winCode: 147,
    pdfCode: 141,
    utfCode: 8220
  },
  quotedblright: {
    name: "quotedblright",
    char: "”",
    stdCode: 186,
    macCode: 211,
    winCode: 148,
    pdfCode: 142,
    utfCode: 8221
  },
  quoteleft: {
    name: "quoteleft",
    char: "‘",
    stdCode: 96,
    macCode: 212,
    winCode: 145,
    pdfCode: 143,
    utfCode: 8216
  },
  quoteright: {
    name: "quoteright",
    char: "’",
    stdCode: 39,
    macCode: 213,
    winCode: 146,
    pdfCode: 144,
    utfCode: 8217
  },
  quotesinglbase: {
    name: "quotesinglbase",
    char: "‚",
    stdCode: 184,
    macCode: 226,
    winCode: 130,
    pdfCode: 145,
    utfCode: 8218
  },
  quotesingle: {
    name: "quotesingle",
    char: "'",
    stdCode: 169,
    macCode: 39,
    winCode: 39,
    pdfCode: 39,
    utfCode: 39
  },
  r: {
    name: "r",
    char: "r",
    stdCode: 114,
    macCode: 114,
    winCode: 114,
    pdfCode: 114,
    utfCode: 114
  },
  registered: {
    name: "registered",
    char: "®",
    stdCode: null,
    macCode: 168,
    winCode: 174,
    pdfCode: 174,
    utfCode: 174
  },
  ring: {
    name: "ring",
    char: "°",
    stdCode: 202,
    macCode: 251,
    winCode: null,
    pdfCode: 30,
    utfCode: 730
  },
  s: {
    name: "s",
    char: "s",
    stdCode: 115,
    macCode: 115,
    winCode: 115,
    pdfCode: 115,
    utfCode: 115
  },
  scaron: {
    name: "scaron",
    char: "š",
    stdCode: null,
    macCode: null,
    winCode: 154,
    pdfCode: 157,
    utfCode: 353
  },
  section: {
    name: "section",
    char: "§",
    stdCode: 167,
    macCode: 164,
    winCode: 167,
    pdfCode: 167,
    utfCode: 167
  },
  semicolon: {
    name: "semicolon",
    char: ";",
    stdCode: 59,
    macCode: 59,
    winCode: 59,
    pdfCode: 59,
    utfCode: 59
  },
  seven: {
    name: "seven",
    char: "7",
    stdCode: 55,
    macCode: 55,
    winCode: 55,
    pdfCode: 55,
    utfCode: 55
  },
  six: {
    name: "six",
    char: "6",
    stdCode: 54,
    macCode: 54,
    winCode: 54,
    pdfCode: 54,
    utfCode: 54
  },
  slash: {
    name: "slash",
    char: "/",
    stdCode: 47,
    macCode: 47,
    winCode: 47,
    pdfCode: 47,
    utfCode: 47
  },
  space: {
    name: "space",
    char: " ",
    stdCode: 32,
    macCode: 32,
    winCode: 32,
    pdfCode: 32,
    utfCode: 32
  },
  sterling: {
    name: "sterling",
    char: "£",
    stdCode: 163,
    macCode: 163,
    winCode: 163,
    pdfCode: 163,
    utfCode: 163
  },
  t: {
    name: "t",
    char: "t",
    stdCode: 116,
    macCode: 116,
    winCode: 116,
    pdfCode: 116,
    utfCode: 116
  },
  thorn: {
    name: "thorn",
    char: "þ",
    stdCode: null,
    macCode: null,
    winCode: 254,
    pdfCode: 254,
    utfCode: 254
  },
  three: {
    name: "three",
    char: "3",
    stdCode: 51,
    macCode: 51,
    winCode: 51,
    pdfCode: 51,
    utfCode: 51
  },
  threequarters: {
    name: "threequarters",
    char: "¾",
    stdCode: null,
    macCode: null,
    winCode: 190,
    pdfCode: 190,
    utfCode: 190
  },
  threesuperior: {
    name: "threesuperior",
    char: "³",
    stdCode: null,
    macCode: null,
    winCode: 179,
    pdfCode: 179,
    utfCode: 179
  },
  tilde: {
    name: "tilde",
    char: "˜",
    stdCode: 196,
    macCode: 247,
    winCode: 152,
    pdfCode: 31,
    utfCode: 732
  },
  trademark: {
    name: "trademark",
    char: "™",
    stdCode: null,
    macCode: 170,
    winCode: 153,
    pdfCode: 146,
    utfCode: 8482
  },
  two: {
    name: "two",
    char: "2",
    stdCode: 50,
    macCode: 50,
    winCode: 50,
    pdfCode: 50,
    utfCode: 50
  },
  twosuperior: {
    name: "twosuperior",
    char: "²",
    stdCode: null,
    macCode: null,
    winCode: 178,
    pdfCode: 178,
    utfCode: 178
  },
  u: {
    name: "u",
    char: "u",
    stdCode: 117,
    macCode: 117,
    winCode: 117,
    pdfCode: 117,
    utfCode: 117
  },
  uacute: {
    name: "uacute",
    char: "ú",
    stdCode: null,
    macCode: 156,
    winCode: 250,
    pdfCode: 250,
    utfCode: 250
  },
  ucircumflex: {
    name: "ucircumflex",
    char: "û",
    stdCode: null,
    macCode: 158,
    winCode: 251,
    pdfCode: 251,
    utfCode: 251
  },
  udieresis: {
    name: "udieresis",
    char: "ü",
    stdCode: null,
    macCode: 159,
    winCode: 252,
    pdfCode: 252,
    utfCode: 252
  },
  ugrave: {
    name: "ugrave",
    char: "ù",
    stdCode: null,
    macCode: 157,
    winCode: 249,
    pdfCode: 249,
    utfCode: 249
  },
  underscore: {
    name: "underscore",
    char: "_",
    stdCode: 95,
    macCode: 95,
    winCode: 95,
    pdfCode: 95,
    utfCode: 95
  },
  v: {
    name: "v",
    char: "v",
    stdCode: 118,
    macCode: 118,
    winCode: 118,
    pdfCode: 118,
    utfCode: 118
  },
  w: {
    name: "w",
    char: "w",
    stdCode: 119,
    macCode: 119,
    winCode: 119,
    pdfCode: 119,
    utfCode: 119
  },
  x: {
    name: "x",
    char: "x",
    stdCode: 120,
    macCode: 120,
    winCode: 120,
    pdfCode: 120,
    utfCode: 120
  },
  y: {
    name: "y",
    char: "y",
    stdCode: 121,
    macCode: 121,
    winCode: 121,
    pdfCode: 121,
    utfCode: 121
  },
  yacute: {
    name: "yacute",
    char: "ý",
    stdCode: null,
    macCode: null,
    winCode: 253,
    pdfCode: 253,
    utfCode: 253
  },
  ydieresis: {
    name: "ydieresis",
    char: "ÿ",
    stdCode: null,
    macCode: 216,
    winCode: 255,
    pdfCode: 255,
    utfCode: 255
  },
  yen: {
    name: "yen",
    char: "¥",
    stdCode: 165,
    macCode: 180,
    winCode: 165,
    pdfCode: 165,
    utfCode: 165
  },
  z: {
    name: "z",
    char: "z",
    stdCode: 122,
    macCode: 122,
    winCode: 122,
    pdfCode: 122,
    utfCode: 122
  },
  zcaron: {
    name: "zcaron",
    char: "ž",
    stdCode: null,
    macCode: null,
    winCode: 158,
    pdfCode: 158,
    utfCode: 382
  },
  zero: {
    name: "zero",
    char: "0",
    stdCode: 48,
    macCode: 48,
    winCode: 48,
    pdfCode: 48,
    utfCode: 48
  },
  // Cyrillic
  Djecyrillic: {
    name: "Djecyrillic",
    char: "Ђ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1026
  },
  afii10051: {
    name: "afii10051",
    char: "Ђ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1026
  },
  Gjecyrillic: {
    name: "Gjecyrillic",
    char: "Ѓ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1027
  },
  afii10052: {
    name: "afii10052",
    char: "Ѓ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1027
  },
  Ljecyrillic: {
    name: "Ljecyrillic",
    char: "Љ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1033
  },
  afii10058: {
    name: "afii10058",
    char: "Љ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1033
  },
  Njecyrillic: {
    name: "Njecyrillic",
    char: "Њ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1034
  },
  afii10059: {
    name: "afii10059",
    char: "Њ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1034
  },
  Kjecyrillic: {
    name: "Kjecyrillic",
    char: "Ќ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1036
  },
  afii10061: {
    name: "afii10061",
    char: "Ќ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1036
  },
  Tshecyrillic: {
    name: "Tshecyrillic",
    char: "Ћ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1035
  },
  afii10060: {
    name: "afii10060",
    char: "Ћ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1035
  },
  Dzhecyrillic: {
    name: "Dzhecyrillic",
    char: "Џ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1039
  },
  afii10145: {
    name: "afii10145",
    char: "Џ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1039
  },
  afii10100: {
    name: "afii10100",
    char: "ѓ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1107
  },
  gjecyrillic: {
    name: "gjecyrillic",
    char: "ѓ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1107
  },
  afii10099: {
    name: "afii10099",
    char: "ђ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1106
  },
  djecyrillic: {
    name: "djecyrillic",
    char: "ђ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1106
  },
  afii10106: {
    name: "afii10106",
    char: "љ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1113
  },
  ljecyrillic: {
    name: "ljecyrillic",
    char: "љ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1113
  },
  afii10107: {
    name: "afii10107",
    char: "њ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1114
  },
  njecyrillic: {
    name: "njecyrillic",
    char: "њ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1114
  },
  afii10109: {
    name: "afii10109",
    char: "ќ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1116
  },
  kjecyrillic: {
    name: "kjecyrillic",
    char: "ќ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1116
  },
  afii10108: {
    name: "afii10108",
    char: "ћ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1115
  },
  tshecyrillic: {
    name: "tshecyrillic",
    char: "ћ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1115
  },
  afii10193: {
    name: "afii10193",
    char: "џ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1119
  },
  dzhecyrillic: {
    name: "dzhecyrillic",
    char: "џ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1119
  },
  Ushortcyrillic: {
    name: "Ushortcyrillic",
    char: "Ў",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1038
  },
  afii10062: {
    name: "afii10062",
    char: "Ў",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1038
  },
  afii10110: {
    name: "afii10110",
    char: "ў",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1118
  },
  ushortcyrillic: {
    name: "ushortcyrillic",
    char: "ў",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1118
  },
  Jecyrillic: {
    name: "Jecyrillic",
    char: "Ј",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1032
  },
  afii10057: {
    name: "afii10057",
    char: "Ј",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1032
  },
  Gheupturncyrillic: {
    name: "Gheupturncyrillic",
    char: "Ґ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1168
  },
  afii10050: {
    name: "afii10050",
    char: "Ґ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1168
  },
  Iocyrillic: {
    name: "Iocyrillic",
    char: "Ё",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1025
  },
  afii10023: {
    name: "afii10023",
    char: "Ё",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1025
  },
  Ecyrillic: {
    name: "Ecyrillic",
    char: "Є",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1028
  },
  afii10053: {
    name: "afii10053",
    char: "Є",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1028
  },
  Yicyrillic: {
    name: "Yicyrillic",
    char: "Ї",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1031
  },
  afii10056: {
    name: "afii10056",
    char: "Ї",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1031
  },
  Icyrillic: {
    name: "Icyrillic",
    char: "І",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1030
  },
  afii10055: {
    name: "afii10055",
    char: "І",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1030
  },
  afii10103: {
    name: "afii10103",
    char: "і",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1110
  },
  icyrillic: {
    name: "icyrillic",
    char: "і",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1110
  },
  afii10098: {
    name: "afii10098",
    char: "ґ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1169
  },
  gheupturncyrillic: {
    name: "gheupturncyrillic",
    char: "ґ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1169
  },
  afii10071: {
    name: "afii10071",
    char: "ё",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1105
  },
  iocyrillic: {
    name: "iocyrillic",
    char: "ё",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1105
  },
  afii10101: {
    name: "afii10101",
    char: "є",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1108
  },
  ecyrillic: {
    name: "ecyrillic",
    char: "є",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1108
  },
  afii10105: {
    name: "afii10105",
    char: "ј",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1112
  },
  jecyrillic: {
    name: "jecyrillic",
    char: "ј",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1112
  },
  Dzecyrillic: {
    name: "Dzecyrillic",
    char: "Ѕ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1029
  },
  afii10054: {
    name: "afii10054",
    char: "Ѕ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1029
  },
  afii10102: {
    name: "afii10102",
    char: "ѕ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1109
  },
  dzecyrillic: {
    name: "dzecyrillic",
    char: "ѕ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1109
  },
  afii10104: {
    name: "afii10104",
    char: "ї",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1111
  },
  yicyrillic: {
    name: "yicyrillic",
    char: "ї",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1111
  },
  Acyrillic: {
    name: "Acyrillic",
    char: "А",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1040
  },
  afii10017: {
    name: "afii10017",
    char: "А",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1040
  },
  Becyrillic: {
    name: "Becyrillic",
    char: "Б",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1041
  },
  afii10018: {
    name: "afii10018",
    char: "Б",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1041
  },
  Vecyrillic: {
    name: "Vecyrillic",
    char: "В",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1042
  },
  afii10019: {
    name: "afii10019",
    char: "В",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1042
  },
  Gecyrillic: {
    name: "Gecyrillic",
    char: "Г",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1043
  },
  afii10020: {
    name: "afii10020",
    char: "Г",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1043
  },
  Decyrillic: {
    name: "Decyrillic",
    char: "Д",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1044
  },
  afii10021: {
    name: "afii10021",
    char: "Д",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1044
  },
  Iecyrillic: {
    name: "Iecyrillic",
    char: "Е",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1045
  },
  afii10022: {
    name: "afii10022",
    char: "Е",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1045
  },
  Zhecyrillic: {
    name: "Zhecyrillic",
    char: "Ж",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1046
  },
  afii10024: {
    name: "afii10024",
    char: "Ж",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1046
  },
  Zecyrillic: {
    name: "Zecyrillic",
    char: "З",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1047
  },
  afii10025: {
    name: "afii10025",
    char: "З",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1047
  },
  Iicyrillic: {
    name: "Iicyrillic",
    char: "И",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1048
  },
  afii10026: {
    name: "afii10026",
    char: "И",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1048
  },
  Iishortcyrillic: {
    name: "Iishortcyrillic",
    char: "Й",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1049
  },
  afii10027: {
    name: "afii10027",
    char: "Й",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1049
  },
  Kacyrillic: {
    name: "Kacyrillic",
    char: "К",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1050
  },
  afii10028: {
    name: "afii10028",
    char: "К",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1050
  },
  Elcyrillic: {
    name: "Elcyrillic",
    char: "Л",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1051
  },
  afii10029: {
    name: "afii10029",
    char: "Л",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1051
  },
  Emcyrillic: {
    name: "Emcyrillic",
    char: "М",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1052
  },
  afii10030: {
    name: "afii10030",
    char: "М",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1052
  },
  Encyrillic: {
    name: "Encyrillic",
    char: "Н",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1053
  },
  afii10031: {
    name: "afii10031",
    char: "Н",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1053
  },
  Ocyrillic: {
    name: "Ocyrillic",
    char: "О",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1054
  },
  afii10032: {
    name: "afii10032",
    char: "О",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1054
  },
  Pecyrillic: {
    name: "Pecyrillic",
    char: "П",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1055
  },
  afii10033: {
    name: "afii10033",
    char: "П",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1055
  },
  Ercyrillic: {
    name: "Ercyrillic",
    char: "Р",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1056
  },
  afii10034: {
    name: "afii10034",
    char: "Р",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1056
  },
  Escyrillic: {
    name: "Escyrillic",
    char: "С",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1057
  },
  afii10035: {
    name: "afii10035",
    char: "С",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1057
  },
  Tecyrillic: {
    name: "Tecyrillic",
    char: "Т",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1058
  },
  afii10036: {
    name: "afii10036",
    char: "Т",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1058
  },
  Ucyrillic: {
    name: "Ucyrillic",
    char: "У",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1059
  },
  afii10037: {
    name: "afii10037",
    char: "У",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1059
  },
  Efcyrillic: {
    name: "Efcyrillic",
    char: "Ф",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1060
  },
  afii10038: {
    name: "afii10038",
    char: "Ф",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1060
  },
  Khacyrillic: {
    name: "Khacyrillic",
    char: "Х",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1061
  },
  afii10039: {
    name: "afii10039",
    char: "Х",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1061
  },
  Tsecyrillic: {
    name: "Tsecyrillic",
    char: "Ц",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1062
  },
  afii10040: {
    name: "afii10040",
    char: "Ц",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1062
  },
  Checyrillic: {
    name: "Checyrillic",
    char: "Ч",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1063
  },
  afii10041: {
    name: "afii10041",
    char: "Ч",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1063
  },
  Shacyrillic: {
    name: "Shacyrillic",
    char: "Ш",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1064
  },
  afii10042: {
    name: "afii10042",
    char: "Ш",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1064
  },
  Shchacyrillic: {
    name: "Shchacyrillic",
    char: "Щ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1065
  },
  afii10043: {
    name: "afii10043",
    char: "Щ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1065
  },
  Hardsigncyrillic: {
    name: "Hardsigncyrillic",
    char: "Ъ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1066
  },
  afii10044: {
    name: "afii10044",
    char: "Ъ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1066
  },
  Yericyrillic: {
    name: "Yericyrillic",
    char: "Ы",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1067
  },
  afii10045: {
    name: "afii10045",
    char: "Ы",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1067
  },
  Softsigncyrillic: {
    name: "Softsigncyrillic",
    char: "Ь",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1068
  },
  afii10046: {
    name: "afii10046",
    char: "Ь",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1068
  },
  Ereversedcyrillic: {
    name: "Ereversedcyrillic",
    char: "Э",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1069
  },
  afii10047: {
    name: "afii10047",
    char: "Э",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1069
  },
  IUcyrillic: {
    name: "IUcyrillic",
    char: "Ю",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1070
  },
  afii10048: {
    name: "afii10048",
    char: "Ю",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1070
  },
  IAcyrillic: {
    name: "IAcyrillic",
    char: "Я",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1071
  },
  afii10049: {
    name: "afii10049",
    char: "Я",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1071
  },
  afii10065: {
    name: "afii10065",
    char: "а",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1072
  },
  acyrillic: {
    name: "acyrillic",
    char: "а",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1072
  },
  afii10066: {
    name: "afii10066",
    char: "б",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1073
  },
  becyrillic: {
    name: "becyrillic",
    char: "б",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1073
  },
  afii10067: {
    name: "afii10067",
    char: "в",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1074
  },
  vecyrillic: {
    name: "vecyrillic",
    char: "в",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1074
  },
  afii10068: {
    name: "afii10068",
    char: "г",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1075
  },
  gecyrillic: {
    name: "gecyrillic",
    char: "г",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1075
  },
  afii10069: {
    name: "afii10069",
    char: "д",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1076
  },
  decyrillic: {
    name: "decyrillic",
    char: "д",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1076
  },
  afii10070: {
    name: "afii10070",
    char: "е",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1077
  },
  iecyrillic: {
    name: "iecyrillic",
    char: "е",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1077
  },
  afii10072: {
    name: "afii10072",
    char: "ж",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1078
  },
  zhecyrillic: {
    name: "zhecyrillic",
    char: "ж",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1078
  },
  afii10073: {
    name: "afii10073",
    char: "з",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1079
  },
  zecyrillic: {
    name: "zecyrillic",
    char: "з",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1079
  },
  afii10074: {
    name: "afii10074",
    char: "и",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1080
  },
  iicyrillic: {
    name: "iicyrillic",
    char: "и",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1080
  },
  afii10075: {
    name: "afii10075",
    char: "й",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1081
  },
  iishortcyrillic: {
    name: "iishortcyrillic",
    char: "й",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1081
  },
  afii10076: {
    name: "afii10076",
    char: "к",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1082
  },
  kacyrillic: {
    name: "kacyrillic",
    char: "к",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1082
  },
  afii10077: {
    name: "afii10077",
    char: "л",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1083
  },
  elcyrillic: {
    name: "elcyrillic",
    char: "л",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1083
  },
  afii10078: {
    name: "afii10078",
    char: "м",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1084
  },
  emcyrillic: {
    name: "emcyrillic",
    char: "м",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1084
  },
  afii10079: {
    name: "afii10079",
    char: "н",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1085
  },
  encyrillic: {
    name: "encyrillic",
    char: "н",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1085
  },
  afii10080: {
    name: "afii10080",
    char: "о",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1086
  },
  ocyrillic: {
    name: "ocyrillic",
    char: "о",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1086
  },
  afii10081: {
    name: "afii10081",
    char: "п",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1087
  },
  pecyrillic: {
    name: "pecyrillic",
    char: "п",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1087
  },
  afii10082: {
    name: "afii10082",
    char: "р",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1088
  },
  ercyrillic: {
    name: "ercyrillic",
    char: "р",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1088
  },
  afii10083: {
    name: "afii10083",
    char: "с",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1089
  },
  escyrillic: {
    name: "escyrillic",
    char: "с",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1089
  },
  afii10084: {
    name: "afii10084",
    char: "т",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1090
  },
  tecyrillic: {
    name: "tecyrillic",
    char: "т",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1090
  },
  afii10085: {
    name: "afii10085",
    char: "у",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1091
  },
  ucyrillic: {
    name: "ucyrillic",
    char: "у",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1091
  },
  afii10086: {
    name: "afii10086",
    char: "ф",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1092
  },
  efcyrillic: {
    name: "efcyrillic",
    char: "ф",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1092
  },
  afii10087: {
    name: "afii10087",
    char: "х",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1093
  },
  khacyrillic: {
    name: "khacyrillic",
    char: "х",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1093
  },
  afii10088: {
    name: "afii10088",
    char: "ц",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1094
  },
  tsecyrillic: {
    name: "tsecyrillic",
    char: "ц",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1094
  },
  afii10089: {
    name: "afii10089",
    char: "ч",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1095
  },
  checyrillic: {
    name: "checyrillic",
    char: "ч",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1095
  },
  afii10090: {
    name: "afii10090",
    char: "ш",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1096
  },
  shacyrillic: {
    name: "shacyrillic",
    char: "ш",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1096
  },
  afii10091: {
    name: "afii10091",
    char: "щ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1097
  },
  shchacyrillic: {
    name: "shchacyrillic",
    char: "щ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1097
  },
  afii10092: {
    name: "afii10092",
    char: "ъ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1098
  },
  hardsigncyrillic: {
    name: "hardsigncyrillic",
    char: "ъ",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1098
  },
  afii10093: {
    name: "afii10093",
    char: "ы",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1099
  },
  yericyrillic: {
    name: "yericyrillic",
    char: "ы",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1099
  },
  afii10094: {
    name: "afii10094",
    char: "ь",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1100
  },
  softsigncyrillic: {
    name: "softsigncyrillic",
    char: "ь",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1100
  },
  afii10095: {
    name: "afii10095",
    char: "э",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1101
  },
  ereversedcyrillic: {
    name: "ereversedcyrillic",
    char: "э",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1101
  },
  afii10096: {
    name: "afii10096",
    char: "ю",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1102
  },
  iucyrillic: {
    name: "iucyrillic",
    char: "ю",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1102
  },
  afii10097: {
    name: "afii10097",
    char: "я",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1103
  },
  iacyrillic: {
    name: "iacyrillic",
    char: "я",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 1103
  },
  // Misc
  afii61352: {
    name: "afii61352",
    char: "№",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 8470
  },
  numero: {
    name: "numero",
    char: "№",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 8470
  },
  nbspace: {
    name: "nbspace",
    char: "",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 160
  },
  currency: {
    name: "currency",
    char: "¤",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 164
  },
  sfthyphen: {
    name: "sfthyphen",
    char: "",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 173
  },
  middot: {
    name: "middot",
    char: "·",
    stdCode: null,
    macCode: null,
    winCode: null,
    pdfCode: null,
    utfCode: 183
  },
  ".notdef": { // replace with whitespace
    name: ".notdef",
    char: " ",
    stdCode: 32,
    macCode: 32,
    winCode: 32,
    pdfCode: 32,
    utfCode: 32
  },
} as const;

export function getCharCodesMapByCode(encoding: "StandardEncoding" | "WinAnsiEncoding" 
| "MacRomanEncoding" | "PDFDocEncoding" | "Utf-16"): Map<number, charEncodingInfo> {
  const map = new Map<number, charEncodingInfo>();
  let prop: string;
  switch (encoding) {
    case "StandardEncoding":
      prop = "stdCode";
      break;
    case "WinAnsiEncoding":
      prop = "winCode";
      break;
    case "MacRomanEncoding":
      prop = "macCode";
      break;
    case "PDFDocEncoding":
      prop = "pdfCode";
      break;
    case "Utf-16":
      prop = "utfCode";
      break;
    default:
      console.log(`Unsupported encoding: '${encoding}'`);
      return map;
  }
  for (const [, info] of Object.entries(pdfCharCodesByName)) {
    if (info[prop]) {
      map.set(info[prop], info);
    }
  }
  return map;
}

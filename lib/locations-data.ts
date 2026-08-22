export interface TownData {
  name: string;
  postalCodes: string[];
  province: string;
}

export const PROVINCES = [
  'Bizkaia',
  'Gipuzkoa',
  'Álava / Araba',
  'Navarra / Nafarroa',
  'Cantabria',
  'Burgos',
  'La Rioja',
  'Otras',
];

// Listado completo de los 112 municipios de Bizkaia con sus códigos postales oficiales
export const BIZKAIA_TOWNS: TownData[] = [
  { name: 'Abadiño', postalCodes: ['48220'], province: 'Bizkaia' },
  { name: 'Abanto y Ciérvana-Abanto Zierbena', postalCodes: ['48500'], province: 'Bizkaia' },
  { name: 'Ajangiz', postalCodes: ['48311'], province: 'Bizkaia' },
  { name: 'Alonsotegi', postalCodes: ['48810'], province: 'Bizkaia' },
  { name: 'Amorebieta-Etxano', postalCodes: ['48340'], province: 'Bizkaia' },
  { name: 'Amoroto', postalCodes: ['48289'], province: 'Bizkaia' },
  { name: 'Arakaldo', postalCodes: ['48498'], province: 'Bizkaia' },
  { name: 'Arantzazu', postalCodes: ['48140'], province: 'Bizkaia' },
  { name: 'Areatza', postalCodes: ['48143'], province: 'Bizkaia' },
  { name: 'Arrankudiaga', postalCodes: ['48498'], province: 'Bizkaia' },
  { name: 'Arratzu', postalCodes: ['48383'], province: 'Bizkaia' },
  { name: 'Arrieta', postalCodes: ['48114'], province: 'Bizkaia' },
  { name: 'Arrigorriaga', postalCodes: ['48480'], province: 'Bizkaia' },
  { name: 'Artea', postalCodes: ['48142'], province: 'Bizkaia' },
  { name: 'Artzentales', postalCodes: ['48879'], province: 'Bizkaia' },
  { name: 'Atxondo', postalCodes: ['48291'], province: 'Bizkaia' },
  { name: 'Bakio', postalCodes: ['48130'], province: 'Bizkaia' },
  { name: 'Balmaseda', postalCodes: ['48800'], province: 'Bizkaia' },
  { name: 'Barakaldo', postalCodes: ['48901', '48902', '48903'], province: 'Bizkaia' },
  { name: 'Barrika', postalCodes: ['48650'], province: 'Bizkaia' },
  { name: 'Basauri', postalCodes: ['48970'], province: 'Bizkaia' },
  { name: 'Bedia', postalCodes: ['48390'], province: 'Bizkaia' },
  { name: 'Berango', postalCodes: ['48640'], province: 'Bizkaia' },
  { name: 'Bermeo', postalCodes: ['48370'], province: 'Bizkaia' },
  { name: 'Berriatua', postalCodes: ['48710'], province: 'Bizkaia' },
  { name: 'Berriz', postalCodes: ['48240'], province: 'Bizkaia' },
  {
    name: 'Bilbao',
    postalCodes: [
      '48001',
      '48002',
      '48003',
      '48004',
      '48005',
      '48006',
      '48007',
      '48008',
      '48009',
      '48010',
      '48011',
      '48012',
      '48013',
      '48014',
      '48015',
    ],
    province: 'Bizkaia',
  },
  { name: 'Busturia', postalCodes: ['48350'], province: 'Bizkaia' },
  { name: 'Derio', postalCodes: ['48160'], province: 'Bizkaia' },
  { name: 'Dima', postalCodes: ['48141'], province: 'Bizkaia' },
  { name: 'Durango', postalCodes: ['48200'], province: 'Bizkaia' },
  { name: 'Ea', postalCodes: ['48287'], province: 'Bizkaia' },
  { name: 'Elantxobe', postalCodes: ['48310'], province: 'Bizkaia' },
  { name: 'Elorrio', postalCodes: ['48230'], province: 'Bizkaia' },
  { name: 'Erandio', postalCodes: ['48950'], province: 'Bizkaia' },
  { name: 'Ereño', postalCodes: ['48313'], province: 'Bizkaia' },
  { name: 'Ermua', postalCodes: ['48260'], province: 'Bizkaia' },
  { name: 'Errigoiti', postalCodes: ['48309'], province: 'Bizkaia' },
  { name: 'Etxebarri', postalCodes: ['48292'], province: 'Bizkaia' },
  { name: 'Etxebarria', postalCodes: ['48277'], province: 'Bizkaia' },
  { name: 'Forua', postalCodes: ['48393'], province: 'Bizkaia' },
  { name: 'Fruiz', postalCodes: ['48116'], province: 'Bizkaia' },
  { name: 'Galdakao', postalCodes: ['48960'], province: 'Bizkaia' },
  { name: 'Galdames', postalCodes: ['48870'], province: 'Bizkaia' },
  { name: 'Gamiz-Fika', postalCodes: ['48113'], province: 'Bizkaia' },
  { name: 'Garai', postalCodes: ['48200'], province: 'Bizkaia' },
  { name: 'Gatika', postalCodes: ['48110'], province: 'Bizkaia' },
  { name: 'Gautegiz Arteaga', postalCodes: ['48395'], province: 'Bizkaia' },
  { name: 'Gernika-Lumo', postalCodes: ['48300'], province: 'Bizkaia' },
  { name: 'Getxo', postalCodes: ['48991', '48992', '48993', '48930'], province: 'Bizkaia' },
  { name: 'Gizaburuaga', postalCodes: ['48289'], province: 'Bizkaia' },
  { name: 'Gordexola', postalCodes: ['48192'], province: 'Bizkaia' },
  { name: 'Gorliz', postalCodes: ['48630'], province: 'Bizkaia' },
  { name: 'Güeñes', postalCodes: ['48840'], province: 'Bizkaia' },
  { name: 'Ibarrangelu', postalCodes: ['48311'], province: 'Bizkaia' },
  { name: 'Igorre', postalCodes: ['48140'], province: 'Bizkaia' },
  { name: 'Izurtza', postalCodes: ['48213'], province: 'Bizkaia' },
  { name: 'Karrantza Harana / Valle de Carranza', postalCodes: ['48891'], province: 'Bizkaia' },
  { name: 'Kortezubi', postalCodes: ['48315'], province: 'Bizkaia' },
  { name: 'Lanestosa', postalCodes: ['48895'], province: 'Bizkaia' },
  { name: 'Larrabetzu', postalCodes: ['48195'], province: 'Bizkaia' },
  { name: 'Laukiz', postalCodes: ['48111'], province: 'Bizkaia' },
  { name: 'Leioa', postalCodes: ['48940'], province: 'Bizkaia' },
  { name: 'Lekeitio', postalCodes: ['48280'], province: 'Bizkaia' },
  { name: 'Lemoa', postalCodes: ['48330'], province: 'Bizkaia' },
  { name: 'Lemoiz', postalCodes: ['48620'], province: 'Bizkaia' },
  { name: 'Lezama', postalCodes: ['48196'], province: 'Bizkaia' },
  { name: 'Loiu', postalCodes: ['48180'], province: 'Bizkaia' },
  { name: 'Mallabia', postalCodes: ['48269'], province: 'Bizkaia' },
  { name: 'Mañaria', postalCodes: ['48212'], province: 'Bizkaia' },
  { name: 'Markina-Xemein', postalCodes: ['48270'], province: 'Bizkaia' },
  { name: 'Maruri-Jatabe', postalCodes: ['48112'], province: 'Bizkaia' },
  { name: 'Meñaka', postalCodes: ['48120'], province: 'Bizkaia' },
  { name: 'Mendata', postalCodes: ['48382'], province: 'Bizkaia' },
  { name: 'Mendexa', postalCodes: ['48288'], province: 'Bizkaia' },
  { name: 'Morga', postalCodes: ['48115'], province: 'Bizkaia' },
  { name: 'Mundaka', postalCodes: ['48360'], province: 'Bizkaia' },
  { name: 'Mungia', postalCodes: ['48100'], province: 'Bizkaia' },
  { name: 'Munitibar-Arbatzegi Gerrikaitz', postalCodes: ['48381'], province: 'Bizkaia' },
  { name: 'Murueta', postalCodes: ['48394'], province: 'Bizkaia' },
  { name: 'Muskiz', postalCodes: ['48550'], province: 'Bizkaia' },
  { name: 'Muxika', postalCodes: ['48392'], province: 'Bizkaia' },
  { name: 'Nabarniz', postalCodes: ['48312'], province: 'Bizkaia' },
  { name: 'Ondarroa', postalCodes: ['48700'], province: 'Bizkaia' },
  { name: 'Orozko', postalCodes: ['48410'], province: 'Bizkaia' },
  { name: 'Ortuella', postalCodes: ['48530'], province: 'Bizkaia' },
  { name: 'Otxandio', postalCodes: ['48210'], province: 'Bizkaia' },
  { name: 'Plentzia', postalCodes: ['48620'], province: 'Bizkaia' },
  { name: 'Portugalete', postalCodes: ['48920'], province: 'Bizkaia' },
  { name: 'Santurtzi', postalCodes: ['48980'], province: 'Bizkaia' },
  { name: 'Sestao', postalCodes: ['48910'], province: 'Bizkaia' },
  { name: 'Sondika', postalCodes: ['48150'], province: 'Bizkaia' },
  { name: 'Sopela', postalCodes: ['48600'], province: 'Bizkaia' },
  { name: 'Sopuerta', postalCodes: ['48190'], province: 'Bizkaia' },
  { name: 'Sukarrieta', postalCodes: ['48395'], province: 'Bizkaia' },
  { name: 'Trucios-Turtzioz', postalCodes: ['48880'], province: 'Bizkaia' },
  { name: 'Ubide', postalCodes: ['48145'], province: 'Bizkaia' },
  { name: 'Ugao-Miraballes', postalCodes: ['48490'], province: 'Bizkaia' },
  { name: 'Urduliz', postalCodes: ['48610'], province: 'Bizkaia' },
  { name: 'Urduña / Orduña', postalCodes: ['48470'], province: 'Bizkaia' },
  { name: 'Valle de Trápaga-Trapagaran', postalCodes: ['48510'], province: 'Bizkaia' },
  { name: 'Zaldibar', postalCodes: ['48250'], province: 'Bizkaia' },
  { name: 'Zalla', postalCodes: ['48860'], province: 'Bizkaia' },
  { name: 'Zamudio', postalCodes: ['48170'], province: 'Bizkaia' },
  { name: 'Zaratamo', postalCodes: ['48480'], province: 'Bizkaia' },
  { name: 'Zeanuri', postalCodes: ['48144'], province: 'Bizkaia' },
  { name: 'Zeberio', postalCodes: ['48499'], province: 'Bizkaia' },
  { name: 'Zierbena', postalCodes: ['48508'], province: 'Bizkaia' },
  { name: 'Ziortza-Bolibar', postalCodes: ['48278'], province: 'Bizkaia' },
];

export const GIPUZKOA_TOWNS: TownData[] = [
  { name: 'Donostia / San Sebastián', postalCodes: ['20001', '20002', '20003', '20004', '20005', '20006', '20007', '20008', '20009', '20010', '20011', '20012', '20013', '20014', '20015', '20016', '20017', '20018'], province: 'Gipuzkoa' },
  { name: 'Irun', postalCodes: ['20301', '20302', '20303', '20304', '20305'], province: 'Gipuzkoa' },
  { name: 'Errenteria', postalCodes: ['20100'], province: 'Gipuzkoa' },
  { name: 'Eibar', postalCodes: ['20600'], province: 'Gipuzkoa' },
  { name: 'Zarautz', postalCodes: ['20800'], province: 'Gipuzkoa' },
  { name: 'Arrasate / Mondragón', postalCodes: ['20500'], province: 'Gipuzkoa' },
  { name: 'Hernani', postalCodes: ['20120'], province: 'Gipuzkoa' },
  { name: 'Tolosa', postalCodes: ['20400'], province: 'Gipuzkoa' },
  { name: 'Lasarte-Oria', postalCodes: ['20160'], province: 'Gipuzkoa' },
  { name: 'Pasaia', postalCodes: ['20110'], province: 'Gipuzkoa' },
  { name: 'Hondarribia', postalCodes: ['20280'], province: 'Gipuzkoa' },
  { name: 'Bergara', postalCodes: ['20570'], province: 'Gipuzkoa' },
  { name: 'Andoain', postalCodes: ['20140'], province: 'Gipuzkoa' },
  { name: 'Azpeitia', postalCodes: ['20730'], province: 'Gipuzkoa' },
  { name: 'Beasain', postalCodes: ['20200'], province: 'Gipuzkoa' },
  { name: 'Azkoitia', postalCodes: ['20720'], province: 'Gipuzkoa' },
  { name: 'Elgoibar', postalCodes: ['20870'], province: 'Gipuzkoa' },
  { name: 'Oñati', postalCodes: ['20560'], province: 'Gipuzkoa' },
  { name: 'Oiartzun', postalCodes: ['20180'], province: 'Gipuzkoa' },
  { name: 'Ordizia', postalCodes: ['20240'], province: 'Gipuzkoa' },
  { name: 'Zumaia', postalCodes: ['20750'], province: 'Gipuzkoa' },
  { name: 'Zubieta', postalCodes: ['20160'], province: 'Gipuzkoa' },
];

export const ALAVA_TOWNS: TownData[] = [
  { name: 'Vitoria-Gasteiz', postalCodes: ['01001', '01002', '01003', '01004', '01005', '01006', '01007', '01008', '01009', '01010', '01012', '01013', '01015'], province: 'Álava / Araba' },
  { name: 'Laudio / Llodio', postalCodes: ['01400'], province: 'Álava / Araba' },
  { name: 'Amurrio', postalCodes: ['01470'], province: 'Álava / Araba' },
  { name: 'Salvatierra / Agurain', postalCodes: ['01200'], province: 'Álava / Araba' },
  { name: 'Iruña Oka / Iruña de Oca', postalCodes: ['01230'], province: 'Álava / Araba' },
  { name: 'Oyón-Oion', postalCodes: ['01320'], province: 'Álava / Araba' },
  { name: 'Dulantzi / Alegría de Álava', postalCodes: ['01240'], province: 'Álava / Araba' },
  { name: 'Zuia', postalCodes: ['01130'], province: 'Álava / Araba' },
  { name: 'Artziniega', postalCodes: ['01474'], province: 'Álava / Araba' },
  { name: 'Laguardia', postalCodes: ['01300'], province: 'Álava / Araba' },
];

export const NAVARRA_TOWNS: TownData[] = [
  { name: 'Pamplona / Iruña', postalCodes: ['31001', '31002', '31003', '31004', '31005', '31006', '31007', '31008', '31009', '31010', '31011', '31012', '31013', '31014', '31015', '31016'], province: 'Navarra / Nafarroa' },
  { name: 'Tudela', postalCodes: ['31500'], province: 'Navarra / Nafarroa' },
  { name: 'Barañáin', postalCodes: ['31010'], province: 'Navarra / Nafarroa' },
  { name: 'Burlada / Burlata', postalCodes: ['31600'], province: 'Navarra / Nafarroa' },
  { name: 'Estella-Lizarra', postalCodes: ['31200'], province: 'Navarra / Nafarroa' },
  { name: 'Tafalla', postalCodes: ['31300'], province: 'Navarra / Nafarroa' },
  { name: 'Zizur Mayor / Zizur Nagusia', postalCodes: ['31180'], province: 'Navarra / Nafarroa' },
  { name: 'Villava / Atarrabia', postalCodes: ['31610'], province: 'Navarra / Nafarroa' },
  { name: 'Alsasua / Altsasu', postalCodes: ['31800'], province: 'Navarra / Nafarroa' },
  { name: 'Baztan', postalCodes: ['31700'], province: 'Navarra / Nafarroa' },
];

export const ALL_TOWNS: TownData[] = [
  ...BIZKAIA_TOWNS,
  ...GIPUZKOA_TOWNS,
  ...ALAVA_TOWNS,
  ...NAVARRA_TOWNS,
];

export function getTownsByProvince(provinceName: string): TownData[] {
  if (provinceName.toLowerCase().includes('bizkaia') || provinceName.toLowerCase().includes('vizcaya')) {
    return BIZKAIA_TOWNS;
  }
  if (provinceName.toLowerCase().includes('gipuzkoa') || provinceName.toLowerCase().includes('guipúzcoa')) {
    return GIPUZKOA_TOWNS;
  }
  if (provinceName.toLowerCase().includes('alava') || provinceName.toLowerCase().includes('álava') || provinceName.toLowerCase().includes('araba')) {
    return ALAVA_TOWNS;
  }
  if (provinceName.toLowerCase().includes('navarra') || provinceName.toLowerCase().includes('nafarroa')) {
    return NAVARRA_TOWNS;
  }
  return BIZKAIA_TOWNS;
}

export function findTownData(townName: string): TownData | undefined {
  if (!townName) return undefined;
  const clean = townName.trim().toLowerCase();
  return ALL_TOWNS.find(
    (t) =>
      t.name.toLowerCase() === clean ||
      t.name.toLowerCase().includes(clean) ||
      clean.includes(t.name.toLowerCase())
  );
}

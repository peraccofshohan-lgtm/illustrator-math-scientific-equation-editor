/* ==========================================================================
 * Module 12 - Periodic table (all 118 IUPAC-recognized elements)
 * Fields: z (atomic number), sym, name, mass (standard atomic weight, or the
 * mass number of the longest-lived isotope when massIsIsotope is true),
 * group (1-18; 0 for lanthanides/actinides f-block), period, category.
 * ========================================================================== */
var Elements = {};
Elements.CATEGORY_NAMES = {
    nm: 'Reactive nonmetal', ng: 'Noble gas', am: 'Alkali metal', ae: 'Alkaline earth metal',
    md: 'Metalloid', pt: 'Post-transition metal', tm: 'Transition metal', la: 'Lanthanide',
    ac: 'Actinide', ha: 'Halogen', un: 'Unknown properties'
};
/* "Z,Sym,Name,Mass,Group,Category" ; mass in brackets = most stable isotope */
Elements.RAW = [
    '1,H,Hydrogen,1.008,1,nm', '2,He,Helium,4.0026,18,ng', '3,Li,Lithium,6.94,1,am', '4,Be,Beryllium,9.0122,2,ae',
    '5,B,Boron,10.81,13,md', '6,C,Carbon,12.011,14,nm', '7,N,Nitrogen,14.007,15,nm', '8,O,Oxygen,15.999,16,nm',
    '9,F,Fluorine,18.998,17,ha', '10,Ne,Neon,20.180,18,ng', '11,Na,Sodium,22.990,1,am', '12,Mg,Magnesium,24.305,2,ae',
    '13,Al,Aluminium,26.982,13,pt', '14,Si,Silicon,28.085,14,md', '15,P,Phosphorus,30.974,15,nm', '16,S,Sulfur,32.06,16,nm',
    '17,Cl,Chlorine,35.45,17,ha', '18,Ar,Argon,39.948,18,ng', '19,K,Potassium,39.098,1,am', '20,Ca,Calcium,40.078,2,ae',
    '21,Sc,Scandium,44.956,3,tm', '22,Ti,Titanium,47.867,4,tm', '23,V,Vanadium,50.942,5,tm', '24,Cr,Chromium,51.996,6,tm',
    '25,Mn,Manganese,54.938,7,tm', '26,Fe,Iron,55.845,8,tm', '27,Co,Cobalt,58.933,9,tm', '28,Ni,Nickel,58.693,10,tm',
    '29,Cu,Copper,63.546,11,tm', '30,Zn,Zinc,65.38,12,tm', '31,Ga,Gallium,69.723,13,pt', '32,Ge,Germanium,72.630,14,md',
    '33,As,Arsenic,74.922,15,md', '34,Se,Selenium,78.971,16,nm', '35,Br,Bromine,79.904,17,ha', '36,Kr,Krypton,83.798,18,ng',
    '37,Rb,Rubidium,85.468,1,am', '38,Sr,Strontium,87.62,2,ae', '39,Y,Yttrium,88.906,3,tm', '40,Zr,Zirconium,91.224,4,tm',
    '41,Nb,Niobium,92.906,5,tm', '42,Mo,Molybdenum,95.95,6,tm', '43,Tc,Technetium,[98],7,tm', '44,Ru,Ruthenium,101.07,8,tm',
    '45,Rh,Rhodium,102.91,9,tm', '46,Pd,Palladium,106.42,10,tm', '47,Ag,Silver,107.87,11,tm', '48,Cd,Cadmium,112.41,12,tm',
    '49,In,Indium,114.82,13,pt', '50,Sn,Tin,118.71,14,pt', '51,Sb,Antimony,121.76,15,md', '52,Te,Tellurium,127.60,16,md',
    '53,I,Iodine,126.90,17,ha', '54,Xe,Xenon,131.29,18,ng', '55,Cs,Caesium,132.91,1,am', '56,Ba,Barium,137.33,2,ae',
    '57,La,Lanthanum,138.91,0,la', '58,Ce,Cerium,140.12,0,la', '59,Pr,Praseodymium,140.91,0,la', '60,Nd,Neodymium,144.24,0,la',
    '61,Pm,Promethium,[145],0,la', '62,Sm,Samarium,150.36,0,la', '63,Eu,Europium,151.96,0,la', '64,Gd,Gadolinium,157.25,0,la',
    '65,Tb,Terbium,158.93,0,la', '66,Dy,Dysprosium,162.50,0,la', '67,Ho,Holmium,164.93,0,la', '68,Er,Erbium,167.26,0,la',
    '69,Tm,Thulium,168.93,0,la', '70,Yb,Ytterbium,173.05,0,la', '71,Lu,Lutetium,174.97,0,la', '72,Hf,Hafnium,178.49,4,tm',
    '73,Ta,Tantalum,180.95,5,tm', '74,W,Tungsten,183.84,6,tm', '75,Re,Rhenium,186.21,7,tm', '76,Os,Osmium,190.23,8,tm',
    '77,Ir,Iridium,192.22,9,tm', '78,Pt,Platinum,195.08,10,tm', '79,Au,Gold,196.97,11,tm', '80,Hg,Mercury,200.59,12,tm',
    '81,Tl,Thallium,204.38,13,pt', '82,Pb,Lead,207.2,14,pt', '83,Bi,Bismuth,208.98,15,pt', '84,Po,Polonium,[209],16,pt',
    '85,At,Astatine,[210],17,ha', '86,Rn,Radon,[222],18,ng', '87,Fr,Francium,[223],1,am', '88,Ra,Radium,[226],2,ae',
    '89,Ac,Actinium,[227],0,ac', '90,Th,Thorium,232.04,0,ac', '91,Pa,Protactinium,231.04,0,ac', '92,U,Uranium,238.03,0,ac',
    '93,Np,Neptunium,[237],0,ac', '94,Pu,Plutonium,[244],0,ac', '95,Am,Americium,[243],0,ac', '96,Cm,Curium,[247],0,ac',
    '97,Bk,Berkelium,[247],0,ac', '98,Cf,Californium,[251],0,ac', '99,Es,Einsteinium,[252],0,ac', '100,Fm,Fermium,[257],0,ac',
    '101,Md,Mendelevium,[258],0,ac', '102,No,Nobelium,[259],0,ac', '103,Lr,Lawrencium,[266],0,ac', '104,Rf,Rutherfordium,[267],4,tm',
    '105,Db,Dubnium,[268],5,tm', '106,Sg,Seaborgium,[269],6,tm', '107,Bh,Bohrium,[270],7,tm', '108,Hs,Hassium,[269],8,tm',
    '109,Mt,Meitnerium,[278],9,un', '110,Ds,Darmstadtium,[281],10,un', '111,Rg,Roentgenium,[282],11,un', '112,Cn,Copernicium,[285],12,tm',
    '113,Nh,Nihonium,[286],13,un', '114,Fl,Flerovium,[289],14,un', '115,Mc,Moscovium,[290],15,un', '116,Lv,Livermorium,[293],16,un',
    '117,Ts,Tennessine,[294],17,un', '118,Og,Oganesson,[294],18,un'
];
Elements.list = [];
Elements.bySymbol = {};
(function () {
    var i, p, m, e, z;
    for (i = 0; i < Elements.RAW.length; i++) {
        p = Elements.RAW[i].split(',');
        z = parseInt(p[0], 10);
        m = p[3];
        e = {
            z: z, sym: p[1], name: p[2],
            mass: parseFloat(m.replace(/[\[\]]/g, '')),
            massIsIsotope: m.charAt(0) === '[',
            group: parseInt(p[4], 10),
            period: z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7,
            category: Elements.CATEGORY_NAMES[p[5]]
        };
        e.block = (e.group === 0) ? 'f' : (e.group <= 2 || e.sym === 'He') ? 's' : (e.group >= 13 ? 'p' : 'd');
        Elements.list.push(e);
        Elements.bySymbol[e.sym] = e;
    }
}());
Elements.get = function (sym) { return U.has(Elements.bySymbol, sym) ? Elements.bySymbol[sym] : null; };
Elements.search = function (q) {
    var out = [], i, e, sc;
    for (i = 0; i < Elements.list.length; i++) {
        e = Elements.list[i];
        sc = U.searchScore(q, [e.sym, e.name, String(e.z), e.category]);
        if (U.trim(q) && U.lower(e.sym) === U.lower(U.trim(q))) { sc = 200; }
        if (sc > 0) { out.push({ e: e, s: sc }); }
    }
    out.sort(function (a, b) { return (b.s - a.s) || (a.e.z - b.e.z); });
    return U.map(out, function (x) { return x.e; });
};

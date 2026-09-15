/* =====================================================================
   MENU DATA — FRANKIES POT
   This is the file you edit. You should never need to open app.js.

   Two things live here:
     1. BUSINESS  — the kitchen's details
     2. MENU      — the food

   Save the file, refresh the page, and your changes are live.
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. BUSINESS DETAILS

   >>> THREE THINGS MUST BE CHECKED BEFORE THIS GOES LIVE <<<
       whatsapp, areas, hours. They are marked CHECK ME below.
   --------------------------------------------------------------------- */

/** @type {import('./types.js').Business} */
const BUSINESS = {
  name: "Frankies Pot",
  tagline: "Your pot of goodness.",

  /* The badge at the top of the page. Replace the file in images/ to
     change it. Set to "" to show the name as plain text instead.        */
  logo: "images/logo.jpg",

  /* CHECK ME — WhatsApp number that receives every order.
     Format: country code first, NO plus sign, NO spaces, NO leading zero.
     0706 144 6572  ->  2347061446572                                    */
  whatsapp: "2347061446572",

  areas: "Lagos",                          // CHECK ME — list the real areas
  hours: "Tuesday to Sunday, 9am to 3pm", // CHECK ME — real opening times
  instagram: "",                           // e.g. "@frankiespot", "" hides it

  /* The old price list said every plate came with water — the new one
     doesn't repeat that, it only calls out free juice on specific combos
     (tagged with note: "Free juice" on those items below). Put a general
     line here only if it's still true; leave it blank to show nothing. */
  orderNotice: "",

  /* Flat delivery fee as a number, e.g. 1500.
     Leave it as null to say the fee is agreed in the WhatsApp chat.      */
  deliveryFee: null,

  /* Flat pack/nylon fee — one charge per order, not per dish. It never
     shows on the site itself; it only appears once the order is sent to
     WhatsApp, added on top of the food total shown here.
     Set to 0 (or delete the line) to turn it off entirely.               */
  packagingFee: 500,

  /* Minimum order value before delivery. Set to 0 to turn it off.        */
  minimumOrder: 2000,
};


/* ---------------------------------------------------------------------
   2. THE FOOD

   Every base, every side and every protein is written out as its own
   line, on purpose — so each one can carry its own photo and be edited
   on its own without touching anything else.

   "with plantain" and "with egg sauce" are two separate lines at the
   same price, because the printed menu uses "plantain/egg sauce" to mean
   a customer picks ONE of the two — different from "plantain & egg
   sauce", which means they get BOTH and pay more for it. That's why you
   see three tiers of most dishes: no side, one side (either), both sides.

   Each item can have:

     name         required
     price        required — this is what the customer actually pays
     description  short, 3 to 8 words reads best
     image        "images/jollof-beef.jpg"
     popular      true  -> shows a Bestseller marker
     note         "Free juice" -> shows a small marker
     soldOut      true  -> greys it out, can't be ordered

   Tapping a dish (the photo or the name) opens a full detail view with a
   bigger photo and the description. The + button adds it to the cart
   directly, without opening that view.

   IMAGES: drop photos into the images folder using the exact file names
   already set below. Square photos, around 800x800. If a photo is
   missing, the page shows a tidy lettered tile instead — nothing breaks,
   so you can launch with the bestsellers photographed and add the rest
   as you go. See images/README.txt for the full checklist.
   --------------------------------------------------------------------- */

/** @type {import('./types.js').MenuGroup[]} */
const MENU = [
  {
    category: "Rice & Spaghetti Combo",
    blurb: "Jollof, white rice or spaghetti",
    items: [
      {
        name: "Jollof rice and beef",
        image: "images/jellof-beef.png",
        price: 2600,
        popular: true,
      },
      {
        name: "White rice and beef",
        image: "images/whiterice-beef.png",
        price: 2600,
      },
      {
        name: "Spaghetti and beef",
        image: "images/spag-beef.png",
        price: 2600,
      },
      {
        name: "Jollof rice and beef, with plantain",
        image: "images/jollof-beef-plantain.png",
        price: 3600,
      },
      {
        name: "White rice and beef, with plantain",
        image: "images/whiterice-beef-plantain.png",
        price: 3600,
      },
      {
        name: "Spaghetti and beef, with plantain",
        image: "images/spaghetti-beef-plantain.jpg",
        price: 3600,
      },
      {
        name: "Jollof rice and beef, with egg sauce",
        image: "images/jollof-egg-beef.png",
        price: 3600,
      },
      {
        name: "White rice and beef, with egg sauce",
        image: "images/whiterice-egg-beef.png",
        price: 3600,
      },
      {
        name: "Spaghetti and beef, with egg sauce",
        image: "images/spag-beef-egg -sauce.png",
        price: 3600,
      },
      {
        name: "Jollof rice and beef, with plantain and egg sauce",
        image: "images/jollof-beef-combo.jpg",
        price: 4600,
      },
      {
        name: "White rice and beef, with plantain and egg sauce",
        image: "images/whiterice-beef-plantain-egg.png",
        price: 4600,
      },
      {
        name: "Spaghetti and beef, with plantain and egg sauce",
        image: "images/spag-eegg-plantain-beef.png",
        price: 4600,
      },
      {
        name: "Jollof rice and chicken",
        image: "images/jellof-chicken.png",
        price: 3400,
      },
      {
        name: "White rice and chicken",
        image: "images/whiterice-chicken.png",
        price: 3400,
      },
      {
        name: "Spaghetti and chicken",
        image: "images/spag-chicken.png",
        price: 3400,
      },
      {
        name: "Jollof rice and chicken, with plantain",
        image: "images/jellof-plantain-chicken.png",
        price: 4400,
      },
      {
        name: "White rice and chicken, with plantain",
        image: "images/white-rice-chicken-plantain.jpg",
        price: 4400,
      },
      {
        name: "Spaghetti and chicken, with plantain",
        image: "images/spaghetti-chicken-plantain.jpg",
        price: 4400,
      },
      {
        name: "Jollof rice and chicken, with egg sauce",
        image: "images/jollof-chicken-egg.png",
        price: 4400,
      },
      {
        name: "White rice and chicken, with egg sauce",
        image: "images/white-rice-chicken-egg-sauce.jpg",
        price: 4400,
      },
      {
        name: "Spaghetti and chicken, with egg sauce",
        image: "images/spag-egg-chicken.png",
        price: 4400,
      },
      {
        name: "Jollof rice and chicken, with plantain and egg sauce",
        image: "images/jollof-egg-plantain-chicken.png",
        price: 5400,
      },
      {
        name: "White rice and chicken, with plantain and egg sauce",
        image: "images/whiterice-plantain-egg-chicken.png",
        price: 5400,
      },
      {
        name: "Spaghetti and chicken, with plantain and egg sauce",
        image: "images/spag-plantain-chicken-egg.png",
        price: 5400,
      },
      {
        name: "Jollof rice and chicken lap",
        image: "images/jollof-chickenlap.png",
        price: 5400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap",
        image: "images/whiterice-chickenlap.png",
        price: 5400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap",
        image: "images/spag-chickenlap.png",
        price: 5400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken lap, with plantain",
        image: "images/jollof-chickenlap-plantain.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap, with plantain",
        image: "images/whiterice-chickenlap-plantain.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with plantain",
        image: "images/spag-plantain-chickenlap.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken lap, with egg sauce",
        image: "images/jollof-chickenlap-egg.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap, with egg sauce",
        image: "images/white-rice-chicken-lap-egg-sauce.jpg",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with egg sauce",
        image: "images/spag-egg-chickenlap.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken lap, with plantain and egg sauce",
        image: "images/jollof-egg-plantain-chickenlap.png",
        price: 7400,
        note: "Free juice",
        popular: true,
      },
      {
        name: "White rice and chicken lap, with plantain and egg sauce",
        image: "images/whiterice-egg-plantain-chickenlap.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with plantain and egg sauce",
        image: "images/spag-plantain-egg-chickenlap.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken wings",
        image: "images/jollof-wings.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken wings",
        image: "images/whiterice-wings.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken wings",
        image: "images/spag-wings.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken wings, with plantain",
        image: "images/jollof-wings-plantain.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken wings, with plantain",
        image: "images/whiterice-wings-plantain.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken wings, with plantain",
        image: "images/spag-wings-plantain.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken wings, with egg sauce",
        image: "images/jollof-wings-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken wings, with egg sauce",
        image: "images/whiterice-wings-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken wings, with egg sauce",
        image: "images/spag-wings-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken wings, with plantain and egg sauce",
        image: "images/jollof-wings-plantain-egg.png",
        price: 8400,
        note: "Free juice",
      },
      {
        name: "White rice and chicken wings, with plantain and egg sauce",
        image: "images/whiterice-wings-plantain-egg.png",
        price: 8400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken wings, with plantain and egg sauce",
        image: "images/spag-wings-plantain-egg.png",
        price: 8400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey",
        image: "images/jellof-turkey.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "White rice and turkey",
        image: "images/whiterice-tureky.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey",
        image: "images/spag-turkey.png",
        price: 6400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with plantain",
        image: "images/jollof-turkey-plantain.jpg",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with plantain",
        image: "images/white-plantain-turkey.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with plantain",
        image: "images/spag-turkey-plantain.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with egg sauce",
        image: "images/jollof-turkey-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with egg sauce",
        image: "images/white-turkey-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with egg sauce",
        image: "images/spag-turkey-egg.png",
        price: 7400,
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with plantain and egg sauce",
        image: "images/jollof-plantain-egg-turkey.png",
        price: 8400,
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with plantain and egg sauce",
        image: "images/white-plantain-egg-turkey.png",
        price: 8400,
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with plantain and egg sauce",
        image: "images/spag-turkey-plantain-egg.png",
        price: 8400,
        note: "Free juice",
      },
    ],
  },

  {
    category: "Sides",
    blurb: "",
    items: [
      {
        name: "White rice",
        image: "images/white-rice.png",
        price: 1000,
      },
      {
        name: "Jollof rice",
        image: "images/jollof-rice.png",
        price: 1250,
      },
      {
        name: "White spaghetti",
        image: "images/white-spag.png",
        price: 1000,
      },
      {
        name: "Jollof spaghetti",
        image: "images/jollof-spag.png",
        price: 1250,
      },
      {
        name: "Moi moi",
        image: "images/moi-moi.png",
        price: 650,
      },
      {
        name: "Boiled yam",
        image: "images/boiled-yam.png",
        price: 1000,
      },
      {
        name: "Boiled plantain",
        image: "images/boiled-plantain.png",
        price: 1000,
      },
      {
        name: "Boiled potato",
        image: "images/boiled potatoe.png",
        price: 1000,
      },
      {
        name: "Fried yam",
        image: "images/yam.png",
        price: 1150,
      },
      {
        name: "Fried potato",
        image: "images/potatoes.png",
        price: 1150,
      },
      {
        name: "Fried plantain",
        image: "images/plantain.png",
        price: 1300,
      },
      {
        name: "Yam porridge",
        image: "images/yam-porriadge.png",
        price: 1500,
      },
      {
        name: "Beans porridge",
        image: "images/beans-porridge-plain.jpg",
        price: 1000,
      },
      {
        name: "Round fish sauce",
        image: "images/fish-sauce.png",
        price: 2000,
      },
      {
        name: "Smoked fish sauce",
        image: "images/smoked-fish-sauce.jpg",
        price: 2500,
      },
      {
        name: "Sardine fish sauce",
        image: "images/sardine.png",
        price: 3000,
      },
    ],
  },

  {
    category: "Protein",
    blurb: "Add to any plate",
    items: [
      {
        name: "Boiled egg",
        image: "images/egg.png",
        price: 500,
      },
      {
        name: "Egg sauce",
        image: "images/egg-sauce.png",
        price: 750,
      },
      {
        name: "Fried egg",
        image: "images/fried-egg.jpg",
        price: 500,
      },
      {
        name: "Beef",
        image: "images/beef.png",
        price: 700,
      },
      {
        name: "Goat meat",
        image: "images/goat-meat.jpg",
        price: 1100,
      },
      {
        name: "Chicken",
        image: "images/chicken-protein.jpg",
        price: 1600,
      },
      {
        name: "Chicken lap",
        image: "images/chicken-lap-protein.jpg",
        price: 3000,
      },
      {
        name: "Chicken wings, breast or ¼ chicken",
        image: "images/chicken-wings-breast-quarter.jpg",
        price: 4000,
      },
      {
        name: "Turkey",
        image: "images/turkey.png",
        price: 4000,
      },
      {
        name: "½ chicken",
        image: "images/half-chicken.png",
        price: 7000,
      },
      {
        name: "Full chicken",
        image: "images/full-chicken.png",
        price: 13000,
      },
    ],
  },

  {
    category: "Soups",
    blurb: "",
    items: [
      {
        name: "Bitter leaf soup",
        image: "images/bitter-leaf.png",
        price: 1500,
      },
      {
        name: "Oha soup",
        image: "images/oha.png",
        price: 1500,
      },
      {
        name: "Okro soup",
        image: "images/okra.png",
        price: 1500,
      },
      {
        name: "Egusi soup",
        image: "images/egusi.png",
        price: 1500,
      },
      {
        name: "Afang soup",
        image: "images/afang.png",
        price: 2000,
      },
      {
        name: "Vegetable soup",
        image: "images/vegetable.png",
        price: 2000,
      },
    ],
  },

  {
    category: "Swallow",
    blurb: "",
    items: [
      {
        name: "Eba",
        image: "images/eba.png",
        price: 500,
      },
      {
        name: "Semo",
        image: "images/semo.png",
        price: 650,
      },
      {
        name: "Fufu",
        image: "images/fufu.png",
        price: 650,
      },
    ],
  },
];
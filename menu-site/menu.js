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
  whatsapp: "2348062976429",

  /* Optional second number. It never shows automatically — a small
     "message not going through?" link appears under the Send button only
     once someone's tried the main number, so this is purely a backup,
     not a second inbox to check every day. Leave it "" to not offer one. */
  whatsappBackup: "2347061446572",

  areas: "Lagos",                          // CHECK ME — list the real areas
  hours: "Tuesday to Sunday, 9am to 3pm", // CHECK ME — real opening times
  instagram: "",                           // e.g. "@frankiespot", "" hides it

  /* Structured version of `hours` above — lets the site automatically
     show itself as closed outside these times, with no dashboard action
     needed each day. The dashboard's manual "We're closed right now"
     toggle still works on top of this, e.g. to close early for the day.
     CHECK ME — must actually match `hours` above, or the closed message
     and the real schedule will disagree.

     days: which days you're OPEN, as weekday numbers — Sun=0, Mon=1,
     Tue=2, Wed=3, Thu=4, Fri=5, Sat=6. open/close: 24-hour "HH:MM", in
     your own local time (no timezone conversion is done).
     Set openHours to null to turn this off entirely (only the manual
     dashboard toggle would control closing, like before this existed). */
  openHours: {
    days: [0, 2, 3, 4, 5, 6], // every day except Monday(1)
    open: "09:00",
    close: "15:00",
  },

  /* The old price list said every plate came with water — the new one
     doesn't repeat that, it only calls out free juice on specific combos
     (tagged with note: "Free juice" on those items below). Put a general
     line here only if it's still true; leave it blank to show nothing. */
  orderNotice: "Every meal comes with a bottle of water",

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
        description: "Smoky party jollof with slow-stewed beef",
        popular: true,
      },
      {
        name: "White rice and beef",
        image: "images/whiterice-beef.png",
        price: 2600,
        description: "Buttery white rice with slow-stewed beef",
        popular: true,
      },
      {
        name: "Spaghetti and beef",
        image: "images/spag-beef.png",
        price: 2600,
        description: "Jollof-style spaghetti with slow-stewed beef",
      },
      {
        name: "Jollof rice and beef, with plantain",
        image: "images/jollof-beef-plantain.png",
        price: 3600,
        description: "Smoky party jollof, slow-stewed beef, sweet fried plantain",
      },
      {
        name: "White rice and beef, with plantain",
        image: "images/whiterice-beef-plantain.png",
        price: 3600,
        description: "Buttery white rice, slow-stewed beef, sweet fried plantain",
      },
      {
        name: "Spaghetti and beef, with plantain",
        image: "images/spaghetti-beef-plantain.jpg",
        price: 3600,
        description: "Jollof-style spaghetti, slow-stewed beef, sweet fried plantain",
      },
      {
        name: "Jollof rice and beef, with egg sauce",
        image: "images/jollof-egg-beef.png",
        price: 3600,
        description: "Smoky party jollof, slow-stewed beef, spicy egg sauce",
      },
      {
        name: "White rice and beef, with egg sauce",
        image: "images/whiterice-egg-beef.png",
        price: 3600,
        description: "Buttery white rice, slow-stewed beef, spicy egg sauce",
      },
      {
        name: "Spaghetti and beef, with egg sauce",
        image: "images/spaghetti-beef-egg-sauce.jpg",
        price: 3600,
        description: "Jollof-style spaghetti, slow-stewed beef, spicy egg sauce",
      },
      {
        name: "Jollof rice and beef, with plantain and egg sauce",
        image: "images/jollof-beef-combo.jpg",
        price: 4600,
        description: "Smoky party jollof, slow-stewed beef, sweet plantain & spicy egg sauce",
      },
      {
        name: "White rice and beef, with plantain and egg sauce",
        image: "images/whiterice-beef-plantain-egg.png",
        price: 4600,
        description: "Buttery white rice, slow-stewed beef, sweet plantain & spicy egg sauce",
      },
      {
        name: "Spaghetti and beef, with plantain and egg sauce",
        image: "images/spag-eegg-plantain-beef.png",
        price: 4600,
        description: "Jollof-style spaghetti, slow-stewed beef, sweet plantain & spicy egg sauce",
      },
      {
        name: "Jollof rice and chicken",
        image: "images/jellof-chicken.png",
        price: 3400,
        description: "Smoky party jollof with grilled chicken",
      },
      {
        name: "White rice and chicken",
        image: "images/whiterice-chicken.png",
        price: 3400,
        description: "Buttery white rice with grilled chicken",
      },
      {
        name: "Spaghetti and chicken",
        image: "images/spag-chicken.png",
        price: 3400,
        description: "Jollof-style spaghetti with grilled chicken",
      },
      {
        name: "Jollof rice and chicken, with plantain",
        image: "images/jellof-plantain-chicken.png",
        price: 4400,
        description: "Smoky party jollof, grilled chicken, sweet fried plantain",
      },
      {
        name: "White rice and chicken, with plantain",
        image: "images/white-rice-chicken-plantain.jpg",
        price: 4400,
        description: "Buttery white rice, grilled chicken, sweet fried plantain",
      },
      {
        name: "Spaghetti and chicken, with plantain",
        image: "images/spaghetti-chicken-plantain.jpg",
        price: 4400,
        description: "Jollof-style spaghetti, grilled chicken, sweet fried plantain",
      },
      {
        name: "Jollof rice and chicken, with egg sauce",
        image: "images/jollof-chicken-egg.png",
        price: 4400,
        description: "Smoky party jollof, grilled chicken, spicy egg sauce",
      },
      {
        name: "White rice and chicken, with egg sauce",
        image: "images/white-rice-chicken-egg-sauce.jpg",
        price: 4400,
        description: "Buttery white rice, grilled chicken, spicy egg sauce",
      },
      {
        name: "Spaghetti and chicken, with egg sauce",
        image: "images/spag-egg-chicken.png",
        price: 4400,
        description: "Jollof-style spaghetti, grilled chicken, spicy egg sauce",
      },
      {
        name: "Jollof rice and chicken, with plantain and egg sauce",
        image: "images/jollof-egg-plantain-chicken.png",
        price: 5400,
        description: "Smoky party jollof, grilled chicken, sweet plantain & spicy egg sauce",
      },
      {
        name: "White rice and chicken, with plantain and egg sauce",
        image: "images/whiterice-plantain-egg-chicken.png",
        price: 5400,
        description: "Buttery white rice, grilled chicken, sweet plantain & spicy egg sauce",
      },
      {
        name: "Spaghetti and chicken, with plantain and egg sauce",
        image: "images/spaghetti-chicken-lap-combo.jpg",
        price: 5400,
        description: "Jollof-style spaghetti, grilled chicken, sweet plantain & spicy egg sauce",
      },
      {
        name: "Jollof rice and chicken lap",
        image: "images/jollof-chickenlap.png",
        price: 5400,
        description: "Smoky party jollof with grilled chicken lap",
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap",
        image: "images/whiterice-chickenlap.png",
        price: 5400,
        description: "Buttery white rice with grilled chicken lap",
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap",
        image: "images/spag-chickenlap.png",
        price: 5400,
        description: "Jollof-style spaghetti with grilled chicken lap",
        note: "Free juice",
        popular: true,
      },
      {
        name: "Jollof rice and chicken lap, with plantain",
        image: "images/jollof-chickenlap-plantain.png",
        price: 6400,
        description: "Smoky party jollof, grilled chicken lap, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap, with plantain",
        image: "images/whiterice-chickenlap-plantain.png",
        price: 6400,
        description: "Buttery white rice, grilled chicken lap, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with plantain",
        image: "images/spag-plantain-chickenlap.png",
        price: 6400,
        description: "Jollof-style spaghetti, grilled chicken lap, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "Jollof rice and chicken lap, with egg sauce",
        image: "images/jollof-chickenlap-egg.png",
        price: 6400,
        description: "Smoky party jollof, grilled chicken lap, spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "White rice and chicken lap, with egg sauce",
        image: "images/white-rice-chicken-lap-egg-sauce.jpg",
        price: 6400,
        description: "Buttery white rice, grilled chicken lap, spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with egg sauce",
        image: "images/spag-egg-chickenlap.png",
        price: 6400,
        description: "Jollof-style spaghetti, grilled chicken lap, spicy egg sauce",
        note: "Free juice",
        popular: true,
      },
      {
        name: "Jollof rice and chicken lap, with plantain and egg sauce",
        image: "images/jollof-egg-plantain-chickenlap.png",
        price: 7400,
        description: "Smoky party jollof, grilled chicken lap, sweet plantain & spicy egg sauce",
        note: "Free juice",
        popular: true,
      },
      {
        name: "White rice and chicken lap, with plantain and egg sauce",
        image: "images/whiterice-egg-plantain-chickenlap.png",
        price: 7400,
        description: "Buttery white rice, grilled chicken lap, sweet plantain & spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Spaghetti and chicken lap, with plantain and egg sauce",
        image: "images/spaghetti-chicken-lap-combo.jpg",
        price: 7400,
        description: "Jollof-style spaghetti, grilled chicken lap, sweet plantain & spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey",
        image: "images/jellof-turkey.png",
        price: 6400,
        description: "Smoky party jollof with grilled turkey",
        note: "Free juice",
      },
      {
        name: "White rice and turkey",
        image: "images/whiterice-tureky.png",
        price: 6400,
        description: "Buttery white rice with grilled turkey",
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey",
        image: "images/spag-turkey.png",
        price: 6400,
        description: "Jollof-style spaghetti with grilled turkey",
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with plantain",
        image: "images/jollof-turkey-plantain.jpg",
        price: 7400,
        description: "Smoky party jollof, grilled turkey, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with plantain",
        image: "images/white-plantain-turkey.png",
        price: 7400,
        description: "Buttery white rice, grilled turkey, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with plantain",
        image: "images/spag-turkey-plantain.png",
        price: 7400,
        description: "Jollof-style spaghetti, grilled turkey, sweet fried plantain",
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with egg sauce",
        image: "images/jollof-turkey-egg.png",
        price: 7400,
        description: "Smoky party jollof, grilled turkey, spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with egg sauce",
        image: "images/white-turkey-egg.png",
        price: 7400,
        description: "Buttery white rice, grilled turkey, spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with egg sauce",
        image: "images/spag-turkey-egg.png",
        price: 7400,
        description: "Jollof-style spaghetti, grilled turkey, spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Jollof rice and turkey, with plantain and egg sauce",
        image: "images/jollof-plantain-egg-turkey.png",
        price: 8400,
        description: "Smoky party jollof, grilled turkey, sweet plantain & spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "White rice and turkey, with plantain and egg sauce",
        image: "images/white-plantain-egg-turkey.png",
        price: 8400,
        description: "Buttery white rice, grilled turkey, sweet plantain & spicy egg sauce",
        note: "Free juice",
      },
      {
        name: "Spaghetti and turkey, with plantain and egg sauce",
        image: "images/spag-turkey-plantain-egg.png",
        price: 8400,
        description: "Jollof-style spaghetti, grilled turkey, sweet plantain & spicy egg sauce",
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
        description: "Plain fluffy white rice",
      },
      {
        name: "Jollof rice",
        image: "images/jollof-rice.png",
        price: 1250,
        description: "Smoky party jollof rice",
      },
      {
        name: "White spaghetti",
        image: "images/white-spag.png",
        price: 1000,
        description: "Plain buttered spaghetti",
      },
      {
        name: "Jollof spaghetti",
        image: "images/jollof-spag.png",
        price: 1250,
        description: "Spaghetti in jollof sauce",
      },
      {
        name: "Moi moi",
        image: "images/moi-moi.png",
        price: 650,
        description: "Steamed bean pudding",
      },
      {
        name: "Boiled yam",
        image: "images/boiled-yam.png",
        price: 1000,
        description: "Soft boiled yam",
      },
      {
        name: "Boiled plantain",
        image: "images/boiled-plantain.png",
        price: 1000,
        description: "Soft boiled plantain",
      },
      {
        name: "Boiled potato",
        image: "images/boiled potatoe.png",
        price: 1000,
        description: "Soft boiled potato",
      },
      {
        name: "Fried yam",
        image: "images/yam.png",
        price: 1150,
        description: "Crispy golden fried yam",
      },
      {
        name: "Fried potato",
        image: "images/potatoes.png",
        price: 1150,
        description: "Crispy golden fried potato",
      },
      {
        name: "Fried plantain",
        image: "images/plantain.png",
        price: 1500,
        description: "Sweet caramelised fried plantain",
      },
      {
        name: "Yam porridge",
        image: "images/yam-porriadge.png",
        price: 1500,
        description: "Yam cooked in peppered sauce",
      },
      {
        name: "Beans porridge",
        image: "images/beans-porridge-plain.jpg",
        price: 1000,
        description: "Beans cooked in peppered sauce",
      },
      {
        name: "Round fish sauce",
        image: "images/fish-sauce.png",
        price: 2000,
        description: "Peppered sauce with round fish",
      },
      {
        name: "Smoked fish sauce",
        image: "images/smoked-fish-sauce.jpg",
        price: 2500,
        description: "Peppered sauce with smoked fish",
      },
      {
        name: "Sardine fish sauce",
        image: "images/sardine.png",
        price: 3000,
        description: "Peppered sauce with sardine",
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
        description: "Simple boiled egg",
      },
      {
        name: "Egg sauce",
        image: "images/egg-sauce.png",
        price: 1500,
        description: "Scrambled eggs in pepper sauce",
      },
      {
        name: "Fried egg",
        image: "images/fried-egg.jpg",
        price: 500,
        description: "Pan-fried egg",
      },
      {
        name: "Beef",
        image: "images/beef.png",
        price: 700,
        description: "Slow-stewed beef chunks",
      },
      {
        name: "Goat meat",
        image: "images/goat-meat.jpg",
        price: 1100,
        description: "Tender stewed goat meat",
      },
      {
        name: "Chicken",
        image: "images/chicken-protein.jpg",
        price: 1600,
        description: "Grilled, seasoned chicken",
      },
      {
        name: "Chicken lap",
        image: "images/chicken-lap-protein.jpg",
        price: 3000,
        description: "Grilled chicken lap",
      },
      {
        name: "Chicken wings, breast or ¼ chicken",
        image: "images/chicken-wings-breast-quarter.jpg",
        price: 4000,
        description: "Grilled wings, breast or quarter",
      },
      {
        name: "Turkey",
        image: "images/turkey.png",
        price: 4000,
        description: "Grilled, seasoned turkey",
      },
      {
        name: "½ chicken",
        image: "images/half-chicken.png",
        price: 7000,
        description: "Half a grilled chicken",
      },
      {
        name: "Full chicken",
        image: "images/full-chicken.png",
        price: 13000,
        description: "A whole grilled chicken",
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
        description: "Traditional bitter leaf soup",
      },
      {
        name: "Oha soup",
        image: "images/oha.png",
        price: 1500,
        description: "Rich oha leaf soup",
      },
      {
        name: "Okro soup",
        image: "images/okra.png",
        price: 1500,
        description: "Okro soup with assorted meat",
      },
      {
        name: "Egusi soup",
        image: "images/egusi.png",
        price: 1500,
        description: "Ground melon seed soup",
      },
      {
        name: "Afang soup",
        image: "images/afang.png",
        price: 2000,
        description: "Afang leaf soup with meat",
      },
      {
        name: "Vegetable soup",
        image: "images/vegetable.png",
        price: 2000,
        description: "Mixed vegetable soup",
      },
      {
        name: "Ogbono soup",
        image: "images/ogbono.jpg",
        price: 1500,
        description: "Slimy ogbono seed soup",
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
        description: "Smooth garri swallow",
      },
      {
        name: "Semo",
        image: "images/semo.png",
        price: 650,
        description: "Smooth semolina swallow",
      },
      {
        name: "Fufu",
        image: "images/fufu.png",
        price: 650,
        description: "Soft cassava swallow",
      },
    ],
  },

  {
    category: "Shawarma",
    blurb: "Chicken, or mixed — regular or large",
    items: [
      {
        name: "Chicken Shawarma (Single Hotdog)",
        image: "images/shawarma-chicken-large.jpeg",
        price: 4000,
        description: "Grilled chicken, veg & sauce in flatbread",
        note: "Free coke",
        popular: true,
      },
      {
        name: "Chicken Shawarma (Double Hotdog)",
        image: "images/shawarma-chicken-large.jpeg",
        price: 5000,
        description: "Grilled chicken, veg & sauce in flatbread",
        note: "Free coke",
        popular: true,
      },
    ],
  },
];
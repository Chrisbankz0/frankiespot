/* =====================================================================
   TYPE DEFINITIONS

   You never need to edit this file. It exists so that VS Code knows the
   shape of your menu data and can help you while you type: autocomplete
   on field names, and a warning when something is misspelled or missing.

   Open menu.js in VS Code and you'll see it working.
   ===================================================================== */

/**
 * @typedef {Object} Business
 * @property {string}  name         Kitchen name, shown large at the top.
 * @property {string}  tagline      One line under the name.
 * @property {string}  [logo]       e.g. "images/logo.jpg". Empty shows the name as text.
 * @property {string}  whatsapp     Country code first, no plus, no spaces, no leading zero.
 * @property {string}  [areas]      Delivery areas, written out.
 * @property {string}  [hours]      Opening days and times.
 * @property {string}  [instagram]  Handle including the @. Empty string hides it.
 * @property {string}  [orderNotice] Short notice, e.g. lead time.
 * @property {number|null} deliveryFee  Flat fee, or null to agree it in chat.
 * @property {number}  [packagingFee]  Flat pack/nylon fee per order. WhatsApp-message only, never shown on the page itself.
 * @property {number}  minimumOrder Minimum spend before delivery. 0 turns it off.
 */

/**
 * @typedef {Object} Size
 * @property {string} label  e.g. "Regular", "Large", "Family"
 * @property {number} price
 */

/**
 * @typedef {Object} MenuItem
 * @property {string}   name
 * @property {number}   [price]        Use this OR sizes, not both. What the customer pays.
 * @property {boolean}  [bonanza]      true -> shows a crossed-out higher price (price ÷ 0.7)
 *                                     and a -30% tag. The customer still pays "price".
 * @property {Size[]}   [sizes]        Portion options, or a pick-one choice.
 * @property {string}   [choose]       Small prompt above the choices, e.g. "Choose your base".
 * @property {string}   [description]  Short. Three to eight words reads best.
 * @property {string}   [image]        e.g. "images/jollof-rice.jpg"
 * @property {boolean}  [popular]      Shows a Bestseller marker.
 * @property {string}   [note]         Small blue marker, e.g. "Weekends only".
 * @property {boolean}  [soldOut]      Greys the item out and blocks ordering.
 */

/**
 * @typedef {Object} MenuGroup
 * @property {string}     category  Section heading, e.g. "Rice".
 * @property {string}     [blurb]   Small note beside the heading.
 * @property {MenuItem[]} items
 */

// This export exists only so the @type imports in menu.js resolve.
export {};
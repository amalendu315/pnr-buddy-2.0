
export const navMenu = [
  { name: "Name List", href: "/namelist" },
  { name: "PNR Details", href: "/pnrdetails" },
  { name: "Flight Ops", href: "/flightops" },
];


export const spicejetTokenUrl = "https://www.spicejet.com/api/v1/token";
export const spicejetPnrRetrieveUrl =
  "https://www.spicejet.com/api/v1/booking/retrieveBookingByPNR";

export const akasaTokenUrl = "https://prod-bl.qp.akasaair.com/api/ibe/token"; // Verify this URL from your env
export const akasaPnrRetrieveUrl =
  "https://prod-bl.qp.akasaair.com/api/ibe/booking/retrieve";
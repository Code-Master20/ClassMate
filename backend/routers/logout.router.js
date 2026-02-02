const router = require("express").Router();
const logOut = require("../controllers/logout.controller");

router.post("/log-out", logOut);

module.exports = router;

/*
HOW LOG OUT TRIGGER IN FRONT END
await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include",
});
*/

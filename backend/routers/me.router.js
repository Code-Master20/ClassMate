const router = require("express").Router();
const isMe = require("../controllers/isMe.controller");
const isMeMiddleware = require("../middlewares/expressMiddleware/isMe.middleware");

router.get("/me", isMeMiddleware, isMe);

module.exports = router;

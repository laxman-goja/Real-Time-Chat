const { addMessage, getMessages, uploadFiles } = require("../controllers/messageController");

const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);


module.exports = router;
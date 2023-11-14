const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRoutes");
const messageRouter = require("./routes/messageRoute");
const socket = require("socket.io");
require("dotenv").config()
const multer = require("multer");



const app = express();

app.use(cors())
app.use(express.json())
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

const listener = app.listen(process.env.PORT, async ()=>{
    console.log(`server listening on port ${process.env.PORT} `)
    console.log('press ctrl C to stop')


    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log('MongoDB Connected.')
    }catch(err){
        console.error('Problem while connecting MongoDB!')
    }
})

const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads')
  },
  filename: function (req, file, callback) {
    callback(null, `${Date.now()}_${file.originalname}`)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.mp4') {
      return cb(res.status(400).end('only jpg, png, mp4 is allowed'), false);
    }
    cb(null, true)
  }
})
 
var upload = multer({ storage: storage }).single("file")

app.post("/api/messages/uploadfiles", (req, res) => {
  upload(req, res, err => {
    if(err) {
      return res.json({ success: false, err })
    }
    return res.json({ success: true, url: res.req.file.path });
  })
});

app.use('/uploads', express.static('uploads'));

const io = socket(listener, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
    }
  });
});


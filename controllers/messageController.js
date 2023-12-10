const Messages = require("../models/messageModel");

function generateRandomKey() {
  return Math.floor(Math.random() * 25) + 1;
}

// Generate the random key once
const secret_key = generateRandomKey();

function encryptMessage(message, secret_key) {
  let encrypted = "";
  for (let i = 0; i < message.length; i++) {
    let ch = message.charCodeAt(i);
    ch += secret_key;
    encrypted += String.fromCharCode(ch);
  }
  return encrypted;
}

function decryptMessage(encryptedMessage, secret_key) {
  let decrypted = "";
  for (let i = 0; i < encryptedMessage.length; i++) {
    let ch = encryptedMessage.charCodeAt(i);
    ch -= secret_key;
    decrypted += String.fromCharCode(ch);
  }
  return decrypted;
}

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    const encryptedMessage = encryptMessage(message, secret_key);

    const data = await Messages.create({
      message: { text: encryptedMessage },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const decryptedMessages = messages.map((msg) => {
      const decryptedMessage = decryptMessage(msg.message.text, secret_key);
      return {
        fromSelf: msg.sender.toString() === from,
        message: decryptedMessage,
      };
    });

    res.json(decryptedMessages);
  } catch (ex) {
    next(ex);
  }
};
// module.exports.addMessage = async (req, res, next) => {
//   try {
//     const { from, to, message } = req.body;
//     const data = await Messages.create({
//       message: { text: message},
//       users: [from, to],
//       sender: from,
//     });

//     if (data) return res.json({ msg: "Message added successfully." });
//     else return res.json({ msg: "Failed to add message to the database" });
//   } catch (ex) {
//     next(ex);
//   }
// };


// module.exports.getMessages = async (req, res, next) => {
//   try {
//     const { from, to } = req.body;

//     const messages = await Messages.find({
//       users: {
//         $all: [from, to],
//       },
//     }).sort({ updatedAt: 1 });

//     const projectedMessages = messages.map((msg) => {
//       return {
//         fromSelf: msg.sender.toString() === from,
//         message: msg.message.text,
//       };
//     });
//     res.json(projectedMessages);
//   } catch (ex) {
//     next(ex);
//   }
// };




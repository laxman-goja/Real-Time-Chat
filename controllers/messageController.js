const Messages = require("../models/messageModel");
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

// Function to generate a random secure key
const generateSecureKey = () => {
  return crypto.randomBytes(32).toString('hex'); // 256 bits key (32 bytes)
};

// Function to save the secret key securely
const saveSecretKey = (key) => {
  fs.writeFileSync(path.join(__dirname, 'secretKey.txt'), key);
};

// Function to load the secret key
const loadSecretKey = () => {
  const keyPath = path.join(__dirname, 'secretKey.txt');
  try {
    return fs.readFileSync(keyPath, 'utf8');
  } catch (err) {
    console.error('Error loading secret key:', err);
    throw new Error('Failed to load secret key');
  }
};

// Check if the secret key exists, otherwise generate and save a new one
let secretKey;
try {
  secretKey = loadSecretKey();
} catch (err) {
  secretKey = generateSecureKey();
  saveSecretKey(secretKey);
}

// Function to encrypt a message
const encryptMessage = (message) => {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(message, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

// Function to decrypt a message
const decryptMessage = (encryptedMessage) => {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    let decrypted = decipher.update(encryptedMessage, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Decryption failed');
  }
};

// Add Message route handler
module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    const encryptedMessage = encryptMessage(message);

    const data = await Messages.create({
      originalMessage: message,
      message: { text: encryptedMessage },
      users: [from, to],
      sender: from,
    });

    if (data) {
      return res.json({ msg: "Message added successfully." });
    } else {
      return res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    next(ex);
  }
};

// Get Messages route handler
module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: { $all: [from, to] },
    }).sort({ updatedAt: 1 });

    const decryptedMessages = messages.map((msg) => {
      try {
        const decryptedMessage = decryptMessage(msg.message.text);
        return {
          fromSelf: msg.sender.toString() === from,
          message: decryptedMessage,
        };
      } catch (err) {
        console.error('Error decrypting message:', err);
        return {
          fromSelf: msg.sender.toString() === from,
          message: 'Error decrypting message',
        };
      }
    });

    res.json(decryptedMessages);
  } catch (ex) {
    next(ex);
  }
};




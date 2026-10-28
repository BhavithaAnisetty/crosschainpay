const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  async findByEmail(email) {
    return await db.collection('users').findOne({ email: email.toLowerCase() });
  }

  async findById(id) {
    return await db.collection('users').findOne({ id });
  }

  async create({ name, email, password, role = 'user', walletAddress = null }) {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = {
      id: 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role.toLowerCase(),
      walletAddress: walletAddress || '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      createdAt: new Date().toISOString()
    };

    await db.collection('users').insertOne(user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async seedDefaultUsers() {
    const defaultUsers = [
      {
        name: 'Alex Rivera (Sender)',
        email: 'sender@crosschain.pay',
        password: 'password123',
        role: 'user',
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
      },
      {
        name: 'Chief Compliance Admin',
        email: 'admin@crosschain.pay',
        password: 'admin123',
        role: 'admin',
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      }
    ];

    for (const u of defaultUsers) {
      const exists = await this.findByEmail(u.email);
      if (!exists) {
        await this.create(u);
      }
    }
  }
}

module.exports = new UserModel();

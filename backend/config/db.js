import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Some networks/ISPs block SRV lookups used by `mongodb+srv://`.
    // Force reliable public resolvers for Atlas DNS discovery.
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
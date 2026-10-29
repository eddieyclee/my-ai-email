import mongoose from "mongoose";

// 開發模式熱更新會重新載入模組，把連線存在 globalThis 避免重複連線
const globalForMongoose = globalThis as unknown as {
  mongooseConnection?: Promise<typeof mongoose>;
};

export function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("缺少 MONGODB_URI 環境變數");

  if (!globalForMongoose.mongooseConnection) {
    globalForMongoose.mongooseConnection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .catch((error) => {
        // 連線失敗時清掉快取，下次請求才會重試
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
  }
  return globalForMongoose.mongooseConnection;
}

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NewsItemSchema = new Schema(
  {
    title: String,
    link: String,
    publishedAt: Date,
    description: String,
  },
  { _id: false },
);

/** 每次寄信的紀錄：寄送結果 + 當下的晨報資料 */
const SentEmailSchema = new Schema(
  {
    status: { type: String, enum: ["sent", "failed"], required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    resendId: String,
    error: String,
    briefDate: { type: String, required: true, index: true },
    weather: {
      location: String,
      date: String,
      description: String,
      currentTemperature: Number,
      maxTemperature: Number,
      minTemperature: Number,
      precipitationProbability: Number,
    },
    stock: {
      stockNo: String,
      name: String,
      date: String,
      open: Number,
      high: Number,
      low: Number,
      close: Number,
      change: Number,
      volume: Number,
    },
    news: [NewsItemSchema],
    summary: {
      weatherSummary: String,
      stockSummary: String,
      newsHighlights: [{ _id: false, title: String, summary: String }],
      encouragement: String,
    },
    html: String,
  },
  { timestamps: true },
);

export type SentEmail = InferSchemaType<typeof SentEmailSchema>;

// 熱更新時模型可能已經註冊過，重複使用避免 OverwriteModelError
export const SentEmailModel: Model<SentEmail> =
  (mongoose.models.SentEmail as Model<SentEmail>) ??
  mongoose.model<SentEmail>("SentEmail", SentEmailSchema);

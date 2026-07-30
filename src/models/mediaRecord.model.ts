import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    fileId: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    versionKey: false
});

const MediaRecord = mongoose.model("MediaRecord", mediaSchema);

export default MediaRecord;
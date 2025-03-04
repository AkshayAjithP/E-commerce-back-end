const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Please provide rating"],
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Please provide review title"],
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, "please provide review text"],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
// ReviewSchema.statics.calculateAverageRating = async function (productId) {
//   console.log(productId);
// };
// ReviewSchema.post("save", async function () {
//   await this.constructor.calculateAverageRating(this.product);
//   console.log("post save hook called");
// });

// ReviewSchema.post("remove", async function () {
//   console.log("post remove hook called");
// });
ReviewSchema.set("strictPopulate", false);
module.exports = mongoose.model("Review", ReviewSchema);

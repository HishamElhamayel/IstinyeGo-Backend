import { Model, model, ObjectId, Schema } from "mongoose";
import { hash, compare } from "bcryptjs";

interface UserDocument {
  firstName: string;
  lastName: string;
  studentId: number;
  email: string;
  password: string;
  role: string;
  phoneNumber?: number;
  verified: boolean;
  tokens: string[];
  wallet: ObjectId;
  favoriteRoutes: ObjectId[];
  licenseNumber?: number;
}

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, {}, Methods>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    studentId: { type: Number, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "driver"], default: "user" },
    phoneNumber: { type: Number },
    verified: { type: Boolean, default: false },
    tokens: [{ type: String }],
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
    favoriteRoutes: [{ type: Schema.Types.ObjectId, ref: "Routes" }],
    licenseNumber: { type: Number },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  const result = await compare(password, this.password);
  return result;
};

export default model("User", userSchema) as Model<UserDocument, {}, Methods>;

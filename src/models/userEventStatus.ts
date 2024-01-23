import type { PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceCheckIn } from "./CheckIn";

export interface InterfaceUserEventStatus {
  _id: Schema.Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  CheckId: PopulatedDoc<InterfaceCheckIn & Document> | null;
}

const userEventStatus = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  checkInId: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: "CheckIn",
  },

  isInvited: {
    type: Boolean,
    required: false,
    default: false,
  },

  isRegistered: {
    type: Boolean,
    required: false,
    default: false,
  },

  isCheckedIn: {
    type: Boolean,
    require: true,
    default: false,
  },
});

userEventStatus.index(
  { userId: 1, eventId: 1 },
  {
    unique: true,
  }
);

const userEventStatusModel = (): Model<InterfaceUserEventStatus> =>
  model<InterfaceUserEventStatus>("UserEventStatus", userEventStatus);

export const UserEventStatus =
  models.UserEventStatus ||
  (userEventStatusModel() as ReturnType<typeof userEventStatusModel>);

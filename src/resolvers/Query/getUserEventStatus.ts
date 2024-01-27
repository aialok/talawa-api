import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { UserEventStatus } from "../../models";

export const getUserEventStatus: QueryResolvers["getUserEventStatus"] = async (
  _parent,
  { userId, eventId },
  context
) => {
  // console.log(user: userId, event:eventId);

  const query = { user: userId, event: eventId };

  const userEventStatus = await UserEventStatus.findOne(query)
    .populate("eventId")
    .lean();

  return userEventStatus;
};

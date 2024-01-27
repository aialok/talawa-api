import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { UserEventStatus } from "../../models";

export const getAllUserEventStatus: QueryResolvers["getAllUserEventStatus"] =
  async (_parent, { eventId }, _context) => {
    const userEventStatus = await UserEventStatus.find({ eventId }).lean();

    return await UserEventStatus.find({ event: eventId })
      .populate("event")
      .populate("user", "-password")
      .lean();
  };

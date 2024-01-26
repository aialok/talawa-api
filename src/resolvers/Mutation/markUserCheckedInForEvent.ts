import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, UserEventStatus } from "../../models";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { Types } from "mongoose";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";

export const markUserCheckedInForEvent: MutationResolvers["markUserCheckedInForEvent"] =
  async (_parent, { userId, eventId }, context) => {
    const currentUser = await User.findOne({
      _id: userId,
    });

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    let event: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([String(eventId)]);
    event = eventFoundInCache[0];

    if (event == null) {
      event = await Event.findOne({
        _id: eventId,
      });

      if (event) {
        await cacheEvents([event]);
      }
    }

    if (event == null) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const isUserEventAdmin = event.admins.some(
      (admin) =>
        admin === context.userId || Types.ObjectId(admin).equals(context.userId)
    );

    if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const requestUser = await User.findOne({
      _id: userId,
    });

    if (requestUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const isUserAlreadyInvitedForEvent = await UserEventStatus.findOne({
      userId,
      eventId,
    });

    if (isUserAlreadyInvitedForEvent) {
      isUserAlreadyInvitedForEvent.isCheckedIn = true;
      isUserAlreadyInvitedForEvent.save();
      return isUserAlreadyInvitedForEvent;
    }

    const checkedInUser = await UserEventStatus.create({
      userId,
      eventId,
      isCheckedIn: true,
    });

    return checkedInUser.toObject();
  };

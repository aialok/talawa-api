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

export const registerUserForEvent: MutationResolvers["registerUserForEvent"] =
  async (_parent, { userId, eventId }, context) => {
    const currentUser = await User.findOne({
      _id: userId, // context
    });

    console.log(eventId, userId);

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

      console.log("dsfhdsfhdnsifhdsfidshfsdifhdsi");

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

    const isUserAlreadyInvited = await UserEventStatus.findOne({
      userId: userId,
      eventId: eventId,
    });

    console.log("IsUserAlreadyInvited ", isUserAlreadyInvited);

    if (isUserAlreadyInvited) {
      isUserAlreadyInvited.isRegistered = true;
      await isUserAlreadyInvited.save();
      return isUserAlreadyInvited.toObject();
    }

    const registeredUser = await UserEventStatus.create({
      userId,
      eventId,
      isRegistered: true,
    });

    return registeredUser.toObject();
  };

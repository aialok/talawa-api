import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee, UserEventStatus } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

export const addEventAttendee: MutationResolvers["addEventAttendee"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  let event: InterfaceEvent | null;

  const eventFoundInCache = await findEventsInCache([args.data.eventId]);

  event = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    event = await Event.findOne({
      _id: args.data.eventId,
    }).lean();

    if (event !== null) {
      await cacheEvents([event]);
    }
  }

  if (event === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const isUserEventAdmin = event.admins.some(
    (admin) =>
      admin === context.userID || Types.ObjectId(admin).equals(context.userId)
  );

  if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  const requestUser = await User.findOne({
    _id: args.data.userId,
  }).lean();

  if (requestUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const userAlreadyAttendee = await EventAttendee.exists({
    ...args.data,
  });

  if (userAlreadyAttendee) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE),
      USER_ALREADY_REGISTERED_FOR_EVENT.CODE,
      USER_ALREADY_REGISTERED_FOR_EVENT.PARAM
    );
  }

  const userEventStatus = await UserEventStatus.findOne({
    userId: args.data.userId,
    eventId: args.data.eventId,
  });

  console.log(userEventStatus);

  if (userEventStatus) {
    //If User is Invited already Register
    userEventStatus.isRegistered = true;
    await userEventStatus.save();
  } else {
    // User is directly registering for the event

    await UserEventStatus.create({
      userId: args.data.userId,
      eventId: args.data.eventId,
      isInvited: true,
    });
  }

  await EventAttendee.create({ ...args.data });

  return requestUser;
};

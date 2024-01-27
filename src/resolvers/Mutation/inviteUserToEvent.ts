import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, UserEventStatus, EventAttendee } from "../../models";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_INVITED_FOR_EVENT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { Types } from "mongoose";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";

export const inviteUserToEvent: MutationResolvers["inviteUserToEvent"] = async (
  _parent,
  { userId, eventId },
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId, // context
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

  const currentUserIsEventAttendee = await EventAttendee.exists({
    userId,
    eventId,
  });

  // Check If user is already a attendee or invited
  if (currentUserIsEventAttendee) {
    throw new errors.InputValidationError(
      requestContext.translate(USER_ALREADY_INVITED_FOR_EVENT.MESSAGE),
      USER_ALREADY_INVITED_FOR_EVENT.CODE,
      USER_ALREADY_INVITED_FOR_EVENT.PARAM
    );
  }

  //   // Adds event._id to registeredEvents list of currentUser with _id === args.userId

  await User.updateOne(
    {
      _id: userId,
    },
    {
      $push: {
        registeredEvents: event._id,
      },
    }
  );

  // Check user is already registred or checkIn for event

  const userEventStatus = await UserEventStatus.findOne({
    user: userId,
    event: eventId,
  });

  if (userEventStatus) {
    throw new errors.InputValidationError(
      requestContext.translate(USER_ALREADY_INVITED_FOR_EVENT.MESSAGE),
      USER_ALREADY_INVITED_FOR_EVENT.CODE,
      USER_ALREADY_INVITED_FOR_EVENT.PARAM
    );
  }

  await EventAttendee.create({
    userId,
    eventId,
  });

  const invitedUser = await UserEventStatus.create({
    user: userId,
    event: eventId,
    isInvited: true,
  });

  return invitedUser.toObject();
};

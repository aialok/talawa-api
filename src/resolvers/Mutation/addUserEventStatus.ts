// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { User, Event, UserEventStatus, InterfaceEvent } from "../../models";
// import {
//   EVENT_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
//   USER_NOT_FOUND_ERROR,
// } from "../../constants";
// import { Types } from "mongoose";
// import { cacheEvents } from "../../services/EventCache/cacheEvents";
// import { findEventsInCache } from "../../services/EventCache/findEventInCache";

// export const addUserEventStatus: MutationResolvers["addUserEventStatus"] =
//   async (_parent, args, context) => {
//     const currentUser = await User.find({
//       _id: context.userId,
//     });

//     if (!currentUser) {
//       throw new errors.NotFoundError(
//         requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//         USER_NOT_FOUND_ERROR.CODE,
//         USER_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     let event: InterfaceEvent | null;

//     const eventFoundInCache = await findEventsInCache([
//       String(args.data?.eventId),
//     ]);

//     event = eventFoundInCache[0];

//     if (!eventFoundInCache) {
//       event = await Event.findOne({
//         _id: args.data?.eventId,
//       });

//       if (event) {
//         await cacheEvents([event]);
//       }
//     }

//     if (!event) {
//       throw new errors.NotFoundError(
//         requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
//         EVENT_NOT_FOUND_ERROR.CODE,
//         EVENT_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     const isUserEventAdmin = event.admins.some(
//       (admin) =>
//         admin === context.userId || Types.ObjectId(admin).equals(context.userId)
//     );

//     if (!isUserEventAdmin && currentUser[0].userType !== "SUPERADMIN") {
//       throw new errors.UnauthorizedError(
//         requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
//         USER_NOT_AUTHORIZED_ERROR.CODE,
//         USER_NOT_AUTHORIZED_ERROR.PARAM
//       );
//     }

//     const requestUser = await User.findOne({
//       _id: args.data?.userId,
//     }).lean();

//     if (requestUser === null) {
//       throw new errors.NotFoundError(
//         requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//         USER_NOT_FOUND_ERROR.CODE,
//         USER_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     const userEventStatus = await UserEventStatus.create({ ...args.data });

//     console.log(userEventStatus)

//     // console.log("Hey");

//     return userEventStatus.lean();
//   };

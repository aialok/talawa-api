import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUserEventStatus } from "../../models/userEventStatus";
import { User, Event, UserEventStatus } from "../../models";
import {Types} from 'mongoose'
import { EVENT_NOT_FOUND_ERROR,USER_NOT_AUTHORIZED_ERROR,USER_NOT_FOUND_ERROR,USER_ALREADY_CHECKED_IN } from "../../constants";




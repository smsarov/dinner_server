import {Room} from '../types';

import handleConnection from './utils/handleConnection';
import handleStatus from './utils/handleStatus';
import handleDislikePressed from "./utils/handleDislikePressed";
import handleDisconnection from './utils/handleDisconnection';

const Rooms: Record<string, Room> = {};

export {Rooms, handleConnection, handleDisconnection, handleStatus, handleDislikePressed}

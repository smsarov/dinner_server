import { Socket } from "socket.io";
import {Rooms} from "../lib";

const getRoomIdBySocket = (socket: Socket) => {
  for (const roomId of socket.rooms) {
    if (roomId in Rooms) return roomId;
  }

  return null;
};

export default getRoomIdBySocket;
import { Socket } from "socket.io";
import { io } from "../../io";
import getRoomIdBySocket from './getRoomIdBySocket';
import {Rooms} from "../lib";

const handleDisconnection = (socket: Socket) => {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  let users = Rooms[roomId].users;
  Rooms[roomId].users = users.filter((user) => user.id !== socket.id);

  io.to(roomId).emit("revalidate", Rooms[roomId].users);

  if (users.length === 0) delete Rooms[roomId];
};

export default handleDisconnection
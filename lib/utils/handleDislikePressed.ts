import { io } from "../../io";
import { Socket } from "socket.io";
import {Rooms} from "../lib";
import getRoomIdBySocket from './getRoomIdBySocket';
import handleStatus from "./handleStatus";


const handleDislikePressed = (socket: Socket, isDisliked: boolean) => {
  const regenerateThreshhold = 0.5;

  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  const users = Rooms[roomId].users;

  const user = users.filter((user) => user.id === socket.id)[0];
  user.isDisliked = isDisliked;

  const dislikes = users.reduce(
    (acc, user) => Number(user.isDisliked) + acc,
    0
  );
  io.to(roomId).emit("dislikePressed", dislikes);

  if (dislikes / users.length > regenerateThreshhold) {
    users.forEach((user) => (user.isDisliked = false));
    handleStatus(socket, "ready");
  }
};

export default handleDislikePressed
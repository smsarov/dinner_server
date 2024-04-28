import { io } from "../../io";
import {User, UserProps} from '../../types'
import { Socket } from "socket.io";

import {Rooms} from "../lib";

const handleConnection = (
  socket: Socket,
  userProps: UserProps,
  roomId: string
) => {
  if (
    Rooms[roomId] &&
    Rooms[roomId].users.filter((user) => user.id === socket.id).length
  )
    return;

  socket.join(roomId);

  const user: User = {
    ...userProps,
    roomId: roomId,
    isDisliked: false,
    id: socket.id,
  };

  if (roomId in Rooms) {
    Rooms[roomId].users.push(user);
  } else {
    Rooms[roomId] = {
      users: [user],
      status: "not ready",
    };
  }

  io.to(roomId).emit("revalidate", Rooms[roomId].users);
};

export default handleConnection;
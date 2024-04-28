import { io, server } from "./io";

import { Status, UserProps } from "./types";
import * as RoomManager from "./lib/lib";

io.on("connection", (socket) => {
  socket.on(
    "data",
    ({ userProps, roomId }: { userProps: UserProps; roomId: string }) => {
      RoomManager.handleConnection(socket, userProps, roomId);
    }
  );

  socket.on("status", (status: Status) => {
    RoomManager.handleStatus(socket, status);
  });

  socket.on("dislikePressed", (isDisliked: boolean) =>
    RoomManager.handleDislikePressed(socket, isDisliked)
  );

  socket.on("disconnecting", () => {
    RoomManager.handleDisconnection(socket);
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

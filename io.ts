import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { User, UserProps, Status } from "./types";

const app = express();
const server = createServer(app);

interface ServerToClientEvents {
  revalidate: (users: User[]) => void;
  result: (answer: string) => void;
  status: (status: Status) => void;
  dislikePressed: (dislikes: number) => void;
}

interface ClientToServerEvents {
  data: ({
    userProps,
    roomId,
  }: {
    userProps: UserProps;
    roomId: string;
  }) => void;
  status: (status: Status) => void;
  dislikePressed: (isDisliked: boolean) => void;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 10 * 60 * 1000,
    skipMiddlewares: true,
  },
});

export { io, server };

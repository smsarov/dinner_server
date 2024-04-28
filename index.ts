import express from "express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
const server = createServer(app);

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 10 * 60 * 1000,
    skipMiddlewares: true,
  },
});

const PORT = 8000;

type User = {
  name: string;
  food: string;
  drink: string;
  id?: string;
  roomId?: string;
  isDisliked?: boolean;
};

type Room = {
  users: User[];
  status: string;
};

const Rooms: Record<string, Room> = {};

const handleConnection = (socket: Socket, user: User, roomId: string) => {
  if (
    Rooms[roomId] &&
    Rooms[roomId].users.filter((user) => user.id === socket.id).length
  )
    return;

  socket.join(roomId);

  user.roomId = roomId;
  user.isDisliked = false;
  user.id = socket.id;

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

const handleReady = async (socket: Socket) => {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  const info = Object.fromEntries(
    Rooms[roomId].users.map((user) => {
      return [
        user.name,
        {
          'wants to eat': user.food,
          'wants to drink': user.drink,
        },
      ];
    })
  );

  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `
        Preferences of users: ${JSON.stringify(info)}.
        Please analyze the preferences of all users and recommend a dinner place that aligns with the majority of their preferences. Consider all factors. 
        Please give the name of a real existing place located in Saint-Petersburg which follows your recommendation.
      `,
      },
    ],
    stream: true,
  });

  changeStatus(socket, "writing");

  let answer = "";
  for await (const chunk of stream) {
    answer += chunk.choices[0]?.delta?.content || "";
    io.to(roomId).emit("result", answer);
  }

  changeStatus(socket, "voting");
};

function changeStatus(socket: Socket, status: string) {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  Rooms[roomId].status = status;
  io.to(roomId).emit("status", status);

  if (status === "ready") {
    handleReady(socket);
  }
}

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
  io.to(roomId).emit("dislike pressed", dislikes);

  if (dislikes / users.length > regenerateThreshhold) {
    users.forEach((user) => (user.isDisliked = false));
    changeStatus(socket, "ready");
  }
};

const handleDisconnection = (socket: Socket) => {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  let users = Rooms[roomId].users;
  Rooms[roomId].users = users.filter((user) => user.id !== socket.id);

  io.to(roomId).emit("revalidate", Rooms[roomId].users);

  if (users.length === 0) delete Rooms[roomId];
};

const getRoomIdBySocket = (socket: Socket) => {
  for (const roomId of socket.rooms) {
    if (roomId in Rooms) return roomId;
  }
};

io.on("connection", (socket) => {
  socket.on("data", ({ user, roomId }: { user: User; roomId: string }) => {
    handleConnection(socket, user, roomId);
  });

  socket.on("status", (status: string) => {
    changeStatus(socket, status);
  });

  socket.on("dislike pressed", (isDisliked: boolean) =>
    handleDislikePressed(socket, isDisliked)
  );

  socket.on("disconnecting", () => {
    handleDisconnection(socket);
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

import { Socket } from "socket.io";

import { io } from "../../io";
import { Status } from "../../types";
import getRoomIdBySocket from "./getRoomIdBySocket";
import {Rooms} from "../lib";

import openai from '../../openai'

async function handleReady(socket: Socket) {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  const info = Object.fromEntries(
    Rooms[roomId].users.map((user) => {
      return [
        user.name,
        {
          "wants to eat": user.food,
          "wants to drink": user.drink,
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

  handleStatus(socket, "writing");

  let answer = "";
  for await (const chunk of stream) {
    answer += chunk.choices[0]?.delta?.content || "";
    io.to(roomId).emit("result", answer);
  }
  handleStatus(socket, "voting");
}

function handleStatus(socket: Socket, status: Status) {
  const roomId = getRoomIdBySocket(socket);
  if (!roomId) return;

  Rooms[roomId].status = status;
  io.to(roomId).emit("status", status);

  if (status === "ready") {
    handleReady(socket);
  }
}


export default handleStatus
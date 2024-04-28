type UserProps = {
  name: string;
  food: string;
  drink: string;
}

type UserInfo = {
  id?: string;
  roomId?: string;
  isDisliked?: boolean;
}

type User = UserProps & UserInfo

type Room = {
  users: User[];
  status: Status;
};

type Status = "not ready" | "ready" | "writing" | "voting" | "done";


export type {UserProps, UserInfo, User, Room, Status}
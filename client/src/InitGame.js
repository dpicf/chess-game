import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomInput, setRoomInput] = useState("");
  const [roomError, setRoomError] = useState("");

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      sx={{ py: 1, height: "100vh" }}
    >
      <CustomDialog
        open={roomDialogOpen}
        handleClose={() => setRoomDialogOpen(false)}
        title="Комната для подключения"
        contentText="Для подключения к комнате, введите корректный ID комнаты"
        handleContinue={() => {
          if (!roomInput) return;
          socket.emit("joinRoom", { roomId: roomInput }, (r) => {
            if (r.error) return setRoomError(r.message);
            console.log("response:", r);
            setRoom(r?.roomId);
            setPlayers(r?.players);
            setOrientation("black");
            setRoomDialogOpen(false);
          });
        }}
      >
        <TextField
          autoFocus
          margin="dense"
          id="room"
          label="ID комнаты"
          name="room"
          value={roomInput}
          required
          onChange={(e) => setRoomInput(e.target.value)}
          type="text"
          fullWidth
          variant="standard"
          error={Boolean(roomError)}
          helperText={
            !roomError ? "Введите ID комнаты" : `Некорректный ID комнаты: ${roomError}`
          }
        />
      </CustomDialog>
      <Button
        variant="contained"
        onClick={() => {
          socket.emit("createRoom", (r) => {
            console.log(r);
            setRoom(r);
            setOrientation("white");
          });
        }}
      >
        Начать игру
      </Button>
      <Button
        onClick={() => {
          setRoomDialogOpen(true);
        }}
      >
        Присоединиться к игре
      </Button>
    </Stack>
  );
}

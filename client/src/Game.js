import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";

function Game({ players, room, orientation, cleanup }) {
  const chess = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(chess.fen());
  const [over, setOver] = useState("");

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const seconds = Math.floor((time % 6000) / 100);
  const milliseconds = time % 100;

  const makeAMove = useCallback(
    (move) => {
      try {
        const result = chess.move(move);
        setFen(chess.fen());

        console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());

        if (chess.isGameOver()) {
          if (chess.isCheckmate()) {
            setOver(
              `Шах и мат! ${chess.turn() === "w" ? "черные" : "белые"} выирали!`
            );
          } else if (chess.isDraw()) {
            setOver("Ничья");
          } else {
            setOver("Конец игры");
          }
        }

        return result;
      } catch (e) {
        return null;
      }
    },
    [chess]
  );

  function onDrop(sourceSquare, targetSquare) {
    setIsRunning(false);

    if (chess.turn() !== orientation[0]) return false;
    if (players.length < 2) return false;

    const color = chess.turn();
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      color: color,
      promotion: "q",
    };

    const move = makeAMove(moveData);

    if (move === null) return false;

    socket.emit("move", {
      move,
      room,
      color,
      seconds,
      milliseconds
    });

    return true;
  }

  useEffect(() => {
    socket.on("opponentJoined", () => {
      setIsRunning(true);
    });
  }, [makeAMove]);

  useEffect(() => {
    socket.on("move", (move) => {
      makeAMove(move);
      setTime(0);
      if (!chess.isGameOver()) {
        setIsRunning(true);
      }
    });
  }, [makeAMove]);

  useEffect(() => {
    socket.on('playerDisconnected', (player) => {
      setIsRunning(false);
      setOver(`${player.username} отключился от игры`);
    });
  }, []);

  useEffect(() => {
    socket.on('closeRoom', ({ roomId }) => {
      setIsRunning(false);
      console.log('closeRoom', roomId, room)
      if (roomId === room) {
        cleanup();
      }
    });
  }, [room, cleanup]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, time]);

  return (
    <Stack>
      <Card>
        <CardContent>
          <Typography variant="h5">ID комнаты: {room}</Typography>
        </CardContent>
      </Card>
      <Stack flexDirection="row" sx={{ pt: 2 }}>
        <div className="board" style={{
          maxWidth: 600,
          maxHeight: 600,
          flexGrow: 1,
        }}>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={orientation}
          />
        </div>
        {players.length > 0 && (
          <Box>
            <List>
              <ListSubheader>Игроки</ListSubheader>
              {players.map((p) => (
                <ListItem key={p.id}>
                  <ListItemText primary={p.username} />
                </ListItem>
              ))}
            </List>
            <ListSubheader>Время: {seconds.toString().padStart(2, "0")}:{milliseconds.toString().padStart(2, "0")}</ListSubheader>
          </Box>)}
      </Stack>
      <CustomDialog
        open={Boolean(over)}
        title={over}
        contentText={over}
        handleContinue={() => {
          socket.emit("closeRoom", { roomId: room });
          cleanup();
        }}
      />
    </Stack>
  );
}

export default Game;

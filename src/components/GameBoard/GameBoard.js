import React, { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import TicTacToeGameABI from "../../contracts/TicTacToeGame.json";
import "./GameBoard.css";

const GameBoard = ({ gameAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [winner, setWinner] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];
        setCurrentAccount(account);

        const contractInstance = new web3Instance.eth.Contract(
          TicTacToeGameABI.abi,
          gameAddress
        );
        setContract(contractInstance);
      } else {
        alert("MetaMask nije instaliran");
      }
    };

    init();
  }, [gameAddress]);

  const loadGameData = useCallback(async () => {
    if (!contract || !currentAccount) return;

    try {
      const rawBoard = await contract.methods.getBoard().call();
      const parsedBoard = rawBoard.map(row => row.map(cell => {
        if (cell === "1") return "X";
        if (cell === "2") return "O";
        return "";
      }));
      setBoard(parsedBoard);

      const currentPlayerAddress = await contract.methods.getCurrentPlayer().call();
      setCurrentPlayer(currentPlayerAddress);

      const winnerAddress = await contract.methods.winner().call();
      setWinner(winnerAddress);

      const isOver = await contract.methods.winner().call() !== "0x0000000000000000000000000000000000000000";
      setGameOver(isOver);

      setIsPlayerTurn(
        currentAccount &&
        currentPlayerAddress &&
        currentAccount.toLowerCase() === currentPlayerAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Greška pri učitavanju podataka:", error);
    }
  }, [contract, currentAccount]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const handleCellClick = async (row, col) => {
    if (!isPlayerTurn || gameOver || !contract) return;

    try {
      await contract.methods.makeMove(row, col).send({ from: currentAccount });
      await loadGameData();
    } catch (err) {
      console.error("Greška pri potezu:", err);
      alert("Transakcija nije uspela.");
    }
  };

  return (
    <div className="game-container">
      <h2>GAME</h2>

      {/* Game Status */}
      {gameOver ? (
        <h3> {winner === "0x0000000000000000000000000000000000000000" ? "It's a draw!" : 
          winner && currentAccount && winner.toLowerCase() === currentAccount.toLowerCase() ? "You won!" : "Opponent won!"}
        </h3>
      ) : (
        <h3>Turn: {(currentPlayer.toLowerCase() === currentAccount.toLowerCase()) ? "You" : "Opponent"}</h3>
      )}

      {/* Game Board */}
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${
                isPlayerTurn && !gameOver && cell === "" ? "clickable" : ""
              }`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default GameBoard;

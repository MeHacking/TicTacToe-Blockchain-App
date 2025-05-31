import React, { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import TicTacToeGameABI from "../../contracts/TicTacToeGame.json";
import "./GameBoard.css";

const GameBoard = ({ gameAddress }) => {

    // State variables
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [board, setBoard] = useState([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
    ]);
    const [currentPlayer, setCurrentPlayer] = useState("");
    const [currentAccount, setCurrentAccount] = useState("");
    const [winner, setWinner] = useState("");
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [player1, setPlayer1] = useState("");

    //Game Data Loading
    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                const account = accounts[0];
                setCurrentAccount(account);
                loadGameData();

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

    //Account Refresh
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                setCurrentAccount(accounts[0]);
            };

            window.ethereum.on("accountsChanged", handleAccountsChanged);

            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            };
        }
    }, []);

    const loadGameData = useCallback(async () => {
        if (!contract || !currentAccount) return;

        try {
            const rawBoard = await contract.methods.getBoard().call();
            const parsedBoard = rawBoard.map((row) =>
                row.map((cell) => {
                    if (cell === "1" || cell === 1 || cell === 1n) return "X";
                    if (cell === "2" || cell === 2 || cell === 2n) return "O";
                    return "";
                })
            );
            setBoard(parsedBoard);

            const player1Address = await contract.methods.player1().call();
            setPlayer1(player1Address);

            const currentPlayerAddress = await contract.methods.getCurrentPlayer().call();
            setCurrentPlayer(currentPlayerAddress);

            const winnerAddress = await contract.methods.winner().call();
            setWinner(winnerAddress);

            const isOver = winnerAddress !== "0x0000000000000000000000000000000000000000";
            setGameOver(isOver);

            setIsPlayerTurn(currentAccount && currentPlayerAddress && currentAccount.toLowerCase() === currentPlayerAddress.toLowerCase());
        } catch (error) {
            console.error("Greška pri učitavanju podataka:", error);
        }
    }, [contract, currentAccount]);

    useEffect(() => {
        loadGameData();
    }, [loadGameData]);

    const handleCellClick = async (row, col) => {
        if (!isPlayerTurn || gameOver || !contract) return;
        // Is board cell already occupied?
        if (board[row][col] !== "") return;

        // Local update of the board
        const updatedBoard = board.map((r) => [...r]);
        updatedBoard[row][col] = currentPlayer.toLowerCase() === player1.toLowerCase() ? "X" : "O";
        setBoard(updatedBoard);

        // Send transaction to make the move
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

            {/* Status igre */}
            {gameOver ? (
                <h3>
                    {winner === "0x0000000000000000000000000000000000000000"
                        ? "It's a draw!"
                        : winner &&
                            currentAccount &&
                            winner.toLowerCase() === currentAccount.toLowerCase()
                            ? "You won!"
                            : "Opponent won!"}
                </h3>
            ) : (
                <h3>
                    Turn:{" "}
                    {currentPlayer.toLowerCase() === currentAccount.toLowerCase()
                        ? "You"
                        : "Opponent"}
                </h3>
            )}

            {/* Tabla za igru */}
            <div className="board">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`cell ${isPlayerTurn && !gameOver && cell === "" ? "clickable" : ""
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

import { useEffect, useState } from 'react';
import TicTacToeFactoryABI from '../../contracts/TicTacToeFactory.json';
import TicTacToeGameABI from '../../contracts/TicTacToeGame.json';
import './GameList.css';
import GameBoard from '../GameBoard/GameBoard.js';

const TicTacToeFactoryAbi = TicTacToeFactoryABI.abi;
const TicTacToeGameAbi = TicTacToeGameABI.abi;

const GameList = ({ web3, account, tictactoeFactoryAddress }) => {
    const [games, setGames] = useState([]);
    const [showGameBoard, setShowGameBoard] = useState(false);
    const [selectedGameAddress, setSelectedGameAddress] = useState(null);

    useEffect(() => {
        const loadGames = async () => {
            if (!web3 || !account) return;

            try {
                const factory = new web3.eth.Contract(TicTacToeFactoryAbi, tictactoeFactoryAddress);
                const gameAddresses = await factory.methods.getAllGames().call();

                const gameData = await Promise.all(gameAddresses.map(async (address) => {
                    const game = new web3.eth.Contract(TicTacToeGameAbi, address);
                    const player1 = await game.methods.player1().call();
                    const player2 = await game.methods.player2().call();
                    const stake = await game.methods.stake().call();
                    const status = await game.methods.status().call();

                    return {
                        address,
                        player1,
                        player2,
                        stake: web3.utils.fromWei(stake, 'ether'),
                        status
                    };
                }));

                console.log("Raw game data:", gameData);

                const activeGames = gameData.filter(game => {
                    const isWaiting = Number(game.status) === 0;
                    const isInProgress = Number(game.status) === 1;
                    const userAddress = account.toLowerCase();

                    if (isWaiting) {
                        return true;
                    }

                    if (isInProgress) {
                        const isPlayer1 = game.player1 && game.player1.toLowerCase() === userAddress;
                        const isPlayer2 = game.player2 && game.player2.toLowerCase() === userAddress;
                        return isPlayer1 || isPlayer2;
                    }

                    return false;
                });

                setGames(activeGames);
                console.log("Filtered games:", activeGames);
            } catch (err) {
                console.error("Failed to load games:", err);
            }
        };

        loadGames();
    }, [web3, account, tictactoeFactoryAddress]);

    const joinGame = async (gameAddress, stake) => {
        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            console.log('MetaMask is not installed or not connected!');
            return;
        }

        if (!web3 || !account) {
            alert("Web3 instance or account is not available.");
            return;
        }

        try {
            const valueInWei = web3.utils.toWei(stake, 'ether');
            const valueInHex = web3.utils.toHex(Number(valueInWei));

            const gameContract = new web3.eth.Contract(TicTacToeGameAbi, gameAddress);

            const transactionParameters = {
                from: account,
                to: gameAddress,
                value: valueInHex,
                data: gameContract.methods.joinGame().encodeABI(),
            };

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });

            console.log("Transaction hash:", txHash);

            setSelectedGameAddress(gameAddress);
            setShowGameBoard(true);

        } catch (error) {
            console.error("Error joining game:", error);
            alert("Error joining game: " + error.message);
        }
    };

    return (
        <>
            <div className="game-list-container">
                <h2>Available Games:</h2>
                {games.length === 0 ? (
                    <p>No games found.</p>
                ) : (
                    <ul className="game-list">
                        {games.map((game, index) => {
                            const isUserPlayer1 = game.player1.toLowerCase() === account.toLowerCase();
                            const isUserPlayer2 = game.player2.toLowerCase() === account.toLowerCase();
                            const isUserInGame = isUserPlayer1 || isUserPlayer2;

                            const isSelected = selectedGameAddress === game.address;

                            return (
                                <li key={index} className="game-item">
                                    {isSelected && showGameBoard ? (
                                        <div>
                                        <GameBoard
                                            gameAddress={game.address}
                                            web3={web3}
                                            account={account}
                                            onClose={() => {
                                                setSelectedGameAddress(null);
                                                setShowGameBoard(false);
                                            }}
                                        />
                                        <button className= "close-button" onClick={() => {setShowGameBoard(false); setSelectedGameAddress(null);}}>Close</button>
                                        </div>
                                    ) : (
                                        <div className='game-info'>
                                            <p><strong>Stake:</strong> {game.stake} ETH</p>
                                            {Number(game.status) === 0 ? (
                                                isUserPlayer1 ? (
                                                    <span className="your-game-label"><strong>| YOUR GAME</strong></span>
                                                ) : (
                                                    <button onClick={() => joinGame(game.address, game.stake)} className="join-button">Join</button>
                                                )
                                            ) : Number(game.status) === 1 && isUserInGame ? (
                                                <button onClick={() => {
                                                    setSelectedGameAddress(game.address);
                                                    setShowGameBoard(true);
                                                }} className="play-button">Play</button>
                                            ) : null}
                                        </div>
                                    )}
                                </li>
                            );
                        })}

                    </ul>
                )}
            </div>
        </>
    );
};

export default GameList;

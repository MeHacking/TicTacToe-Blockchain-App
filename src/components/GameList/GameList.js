import React, { useEffect, useState } from 'react';
import TicTacToeFactoryABI from '../../contracts/TicTacToeFactory.json';
import TicTacToeGameABI from '../../contracts/TicTacToeGame.json';
import './GameList.css';

const GameList = ({ web3, account, tictactoeFactoryAddress }) => {

    const TicTacToeFactoryAbi = TicTacToeFactoryABI.abi;
    const TicTacToeGameAbi = TicTacToeGameABI.abi;
    const [games, setGames] = useState([]);

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

                setGames(gameData);
                console.log("Games loaded:", gameData);
            } catch (err) {
                console.error("Failed to load games:", err);
            }
        };

        loadGames();
    }, [web3, account, tictactoeFactoryAddress]);

    const joinGame = async (gameAddress, stake) => {
        if (!web3 || !account) return;
        const game = new web3.eth.Contract(TicTacToeGameAbi, gameAddress);
        try {
            await game.methods.joinGame().send({ from: account, value: web3.utils.toWei(stake, 'ether') });
            alert("Joined the game!");
        } catch (error) {
            console.error("Error joining game:", error);
        }
    };

    return (
        <div className="game-list-container">
            <h2>Join A Game</h2>
            {games.length === 0 ? (
                <p>No games found.</p>
            ) : (
                <ul className="game-list">
                    {games.map((game, index) => (
                        <li key={index} className="game-item">
                            <div className='game-info'>
                                <p><strong>Stake:</strong> {game.stake} ETH</p>
                                <button onClick={() => joinGame(game.address, game.stake)} className="join-button">Join</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default GameList;

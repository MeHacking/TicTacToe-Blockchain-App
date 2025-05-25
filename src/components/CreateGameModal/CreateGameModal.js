import './CreateGameModal.css';
import React, { useState } from 'react';
import TicTacToeFactoryABI from '../../contracts/TicTacToeFactory.json';

const CreateGameModal = ({ onClose, web3, account, tictactoeFactoryAddress }) => {

    const [gameData, setGameData] = useState({ stake: '' });

    const handleChange = (e) => {

        setGameData({ ...gameData, [e.target.name]: e.target.value });

    };

    const handleSubmit = async () => {

        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {

            console.log('MetaMask is not installed or not connected!');

            return;

        }

        if (!web3 || !account) {

            alert("Web3 instance or account is not available.");

            return;

        }

        try {

            const tictactoeFactory = new web3.eth.Contract(TicTacToeFactoryABI.abi, tictactoeFactoryAddress);

            const transactionParameters = {

                to: tictactoeFactoryAddress,

                from: account,

                data: tictactoeFactory.methods.createGame(

                    gameData.stake

                ).encodeABI() // call to contract method

            };

            // txHash is a hex string

            const txHash = await window.ethereum.request({

                method: 'eth_sendTransaction',

                params: [transactionParameters],

            });

            console.log("Transaction Hash:", txHash);

            onClose();

        } catch (error) {

            console.error("Error sending transaction:", error);

        }

    };

    return (
        <div className="create-game-modal">
            <h2>Set your stake:</h2>
            <input type="text" className='modal-input' placeholder="Please input a value" onChange={handleChange} />
            <button className='modal-button' onClick={handleSubmit}>Submit</button>
            <button className="modal-button cancel-button" onClick={onClose}>Cancel</button>
        </div>
    );
}

export default CreateGameModal;
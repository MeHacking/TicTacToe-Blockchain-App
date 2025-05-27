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

            const valueInWei = web3.utils.toWei(gameData.stake, 'ether');
            //Converting stake to hex because MetaMask requires hex format for value, also Number() is used to ensure the value is a number rather than a string
            const valueInHex = web3.utils.toHex(Number(valueInWei)); 

            const transactionParameters = {

                from: account,

                to: tictactoeFactoryAddress,

                value: valueInHex,

                data: tictactoeFactory.methods.createGame().encodeABI(),

            };

            const txHash = await window.ethereum.request({

                method: 'eth_sendTransaction',

                params: [transactionParameters],

            });

            onClose();

        } catch (error) {

            console.error("Error sending transaction:", error);

        }

    };

    return (
        <div className="create-game-modal">
            <h2>Set your stake:</h2>
            <input type="number" step="0.0001" min="0" className='modal-input' name='stake' placeholder="Please input the amount of ETH" onChange={handleChange} />
            <button className='modal-button' onClick={handleSubmit}>Submit</button>
            <button className="modal-button cancel-button" onClick={onClose}>Cancel</button>
        </div>
    );
}

export default CreateGameModal;
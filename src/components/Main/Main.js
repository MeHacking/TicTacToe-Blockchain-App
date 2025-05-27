import React, { useState, useEffect } from 'react';
import GameList from '../GameList/GameList.js';
import CreateGameModal from '../CreateGameModal/CreateGameModal.js';
import Web3 from 'web3';
import './Main.css';

const tictactoeFactoryAddress = "0xaE036c65C649172b43ef7156b009c6221B596B8b"; // Replace with your actual contract address when deployed
const sepoliaRPCUrl = "https://sepolia.infura.io/v3/8e51829c693a42819c27393d4e0ff583";

const Main = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);

    const connectWallet = async () => {

        try {
            if (window.ethereum) {
                console.log("MetaMask is installed");
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                console.log(accounts);
                setAccount(accounts[0]);

                window.ethereum.on('accountsChanged', (newAccounts) => {
                    console.log("Account changed: ", newAccounts[0]);
                    setAccount(newAccounts[0]);
                });
            } else {
                console.log("MetaMask is not installed");
            }
        } catch (error) {
            console.error("Error connecting to wallet: ", error);

        }
    };

    useEffect(() => {
        const web3Instance = new Web3(sepoliaRPCUrl);
        console.log(web3Instance);
        setWeb3(web3Instance);
        console.log("Web3 instance set up: ", web3);

    }, []);

    useEffect(() => {
        console.log("Web3 instance is ready: ", web3);

    }, [web3]);

    return (
        <div className="main-container">
            <h1>Tic Tac Toe</h1>
            <p>Welcome to the Tic Tac Toe game!</p>

            {!account ? (
                <div className="connect-wallet">
                    <button className="connect-wallet-button" onClick={connectWallet}>Connect with MetaMask</button>
                </div>
            ) : (
                <div className="connected-wallet">
                    <button className="connect-wallet-button">Connected Wallet: {account} </button>
                </div>
            )}

            <GameList className="game-list" web3={web3} account={account} tictactoeFactoryAddress={tictactoeFactoryAddress} />

            <h2>or create a new one...</h2>
            <button className="create-game-button" onClick={() => setShowCreateModal(true)}>NEW GAME</button>
            {showCreateModal && (
                <CreateGameModal className="modal-overlay"
                    web3={web3}
                    account={account}
                    tictactoeFactoryAddress={tictactoeFactoryAddress}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

        </div>
    );
}

export default Main;
import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import InputDataDecoder from 'ethereum-input-data-decoder';
import dayjs from 'dayjs';

const web3Modal = new Web3Modal({
    network: 'goerli',
    providerOptions: {}
});

const MsgBoard = () => {
    const [contract, setContract] = useState(null);
    const [contractAddress, setContractAddress] = useState('');
    const [address, setAddress] = useState('0x0');
    const [balance, setBalance] = useState('0');
    // const [ensAddress, setEnsAddress] = useState('0');
    const [contractBalance, setContractBalance] = useState('0');
    const [message, setMessage] = useState('');
    const [paidMsg, setPaidMsg] = useState('');
    const [paidMsgFrom, setPaidMsgFrom] = useState('');
    const [paidMsgTime, setPaidMsgTime] = useState('');
    const [inputMsg, setInputMsg] = useState('');

    useEffect(() => {
        async function init() {
            const instance = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(instance);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);
            // const ensAddress = await provider.lookupAddress(address);

            const contractAddr = '0xf5c9284880DC752D3b280BA0258F600fC2Ebc330';
            const abi = [
                {
                    inputs: [
                        {
                            internalType: 'string',
                            name: 'str',
                            type: 'string'
                        }
                    ],
                    name: 'store',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function'
                },
                {
                    inputs: [
                        {
                            internalType: 'string',
                            name: 'str',
                            type: 'string'
                        }
                    ],
                    name: 'storePaidMsg',
                    outputs: [],
                    stateMutability: 'payable',
                    type: 'function'
                },
                {
                    inputs: [],
                    name: 'message',
                    outputs: [
                        {
                            internalType: 'string',
                            name: '',
                            type: 'string'
                        }
                    ],
                    stateMutability: 'view',
                    type: 'function'
                },
                {
                    inputs: [],
                    name: 'retrievePaidMsg',
                    outputs: [
                        {
                            internalType: 'string',
                            name: '',
                            type: 'string'
                        }
                    ],
                    stateMutability: 'view',
                    type: 'function'
                }
            ];
            const contract = new ethers.Contract(contractAddr, abi, signer);
            const contractBalance = await contract.provider.getBalance(contractAddr);
            const contractAddress = contract.address;
            const Meg = await contract.message()

            // etherscan 公開的 api
            const apiUrl = `https://api-goerli.etherscan.io/api?module=account&action=txlist&address=${contractAddr}&startblock=0&endblock=99999999&sort=asc`;

            // 發送 HTTP 請求
            const response = await ethers.utils.fetchJson(apiUrl);

            // 取得合約全部記錄(包括連接合約、付費、免費)
            const transactions = response.result;

            // 取得付費訊息的交易紀錄
            const paidTransactions = transactions.filter((tx) => tx.to.toLowerCase() === contractAddr.toLowerCase() && tx.value == 1000000000000);

            // 取得付費訊息交易記錄，將最新的資料放在上面，取得最新的一筆
            const paidMsgList = paidTransactions
                .map((tx) => {
                    let decoder = new InputDataDecoder(abi); //解碼交易訊息
                    let time = dayjs.unix(tx.timeStamp);
                    return {
                        time: time.format('YYYY-MM-DD HH:mm:ss'),
                        input: decoder.decodeData(tx.input), //解碼交易訊息
                        from: tx.from
                    };
                })
                .reverse()[0];
            const paidMsg = paidMsgList.input.inputs.toString();
            const paidMsgFrom = paidMsgList.from;
            const paidMsgTime = paidMsgList.time;

            // 取得免費訊息的交易紀錄
            const freeTransactions = transactions.filter((tx) => tx.to.toLowerCase() === contractAddr.toLowerCase() && tx.value == 0);

            // 取得免費訊息交易記錄裡面訊息及使用者，將最新的資料放在上面
            const message = freeTransactions
                .map((tx) => {
                    let decoder = new InputDataDecoder(abi); //解碼交易訊息
                    let time = dayjs.unix(tx.timeStamp);
                    return {
                        time: time.format('YYYY-MM-DD HH:mm:ss'),
                        input: decoder.decodeData(tx.input), //解碼交易訊息
                        from: tx.from
                    };
                })
                .reverse();

            setContract(contract);
            setContractAddress(contractAddress);
            setAddress(address);
            // setEnsAddress(ensAddress);
            setBalance(ethers.utils.formatEther(balance));
            setContractBalance(ethers.utils.formatEther(contractBalance));
            setMessage(message);
            setPaidMsg(paidMsg);
            setPaidMsgFrom(paidMsgFrom);
            setPaidMsgTime(paidMsgTime);
        }
        init();
    }, []);

    return (
        <div className="Home">
            <header className="Home-herder">
            Message board
                <div className="InputBox">
                    <input placeholder="Enter Some Message..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)}></input>
                    <div>
                        <button
                            onClick={() => {
                                async function storeFunction() {
                                    let tx = await contract.store(inputMsg);
                                    await tx.wait();
                                    let _msg = await contract.message();
                                    setMessage(_msg);
                                }
                                storeFunction();
                            }}
                        >
                            Store Message
                        </button>
                        <button
                            onClick={() => {
                                async function storeFunction() {
                                    let tx = await contract.storePaidMsg(inputMsg, {
                                        value: ethers.utils.parseEther('0.000001')
                                    });
                                    await tx.wait();
                                    const _paidMsg = await contract.retrievePaidMsg();
                                    setPaidMsg(_paidMsg);
                                }
                                storeFunction();
                            }}
                        >
                            Store Paid Message
                        </button>
                    </div>
                </div>
                <p className="Home-content">
                    This contract Address is "{contractAddress}".
                    <br />
                    This contract balance is "{contractBalance}".
                    <br />
                    <br />
                    Hi "ensAddress" ! <br />
                    Your balance is "{balance}" ETH. <br />
                    Your address is "{address}". <br />
                </p>
                <div className="PaidMessageItem">
                    <div className="MessageTitle">
                        Store Paid Message <br />
                    </div>
                    <div className="MessageText">{paidMsg}</div>
                    <div className="MessageDetail">
                        From：{paidMsgFrom}　{paidMsgTime}
                    </div>
                </div>
                <div className="MessageList">
                    {Array.isArray(message) &&
                        message.map((tx) => (
                            <div className="MessageItem" key={tx.input.inputs.toString()}>
                                <div className="MessageTitle">Store Message</div>
                                <div className="MessageText">{tx.input.inputs}</div>
                                <div className="MessageDetail">
                                    From：{tx.from}　{tx.time}
                                </div>
                            </div>
                        ))}
                </div>
            </header>
        </div>
    );
};

export default MsgBoard;

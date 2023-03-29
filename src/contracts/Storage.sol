// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8; //版本


// 合約名字,
// 有兩個參數private,public 預設是Private:沒辦法直接看到他
contract Storage { 
    string public message; // 免費的訊息
    string paidMessage; // 付費的訊息

    function store(string memory str) public {
        message = str; 
		// 免費訊息是只要付手續費就可以儲存它
		// memory key word 是會在這個 function 結束之後消失
    // public 是指任何人都可以調用這個 function
    }

    function storePaidMsg(string memory str) public payable {
		// payable 指的是可以收乙太幣的 這則訊息有手續費 0.001以太幣
        require(msg.value == 0.000001 ether, "Not enough fund");
        paidMessage = str;
		//前面成功付費的 message 傳入新的 str
    }

    function retrievePaidMsg() public view returns (string memory){
		// etrievePaidMsg() 拿到付費的資訊
		// view 查看智能合約裡的變數
        return paidMessage;
    }

}

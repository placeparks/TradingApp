import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Form } from 'react-bootstrap';
import { Web3Button, ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { contractAddress, contractAbi, usdtContractAddress, usdtContractAbi, pilaContractAbi, pilaContractAddress } from "./contract";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles/Home.css";
import { ethers } from 'ethers';

export default function Home() {
  const [amountPILA, setAmountPILA] = useState(0);
  const [amountUSDT, setAmountUSDT] = useState(0);
  const [activeTab, setActiveTab] = useState('buy');
  const [sellingPrice, setSellingPrice] = useState(null);
  const [isUSDTApproved, setIsUSDTApproved] = useState(false);
  const [isPILAApproved, setIsPILAApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const address = useAddress();

  useEffect(() => {
    const fetchPrices = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractAbi, provider);
      const sellPrice = await contract.sellingPricePerUSDT();
      setSellingPrice(ethers.utils.formatUnits(sellPrice, 'wei'));
    };
    fetchPrices();
  }, []);

  const onApproveStart = () => {
    setIsApproving(true);
  };

  const onUSDTApproveSuccess = () => {
    alert("USDT Approved Successfully!");
    setIsUSDTApproved(true);
    setIsApproving(false);
  };

  const onPILAApproveSuccess = () => {
    alert("PILA Approved Successfully!");
    setIsPILAApproved(true);
    setIsApproving(false);
  };

  const onApproveFailure = () => {
    alert("Cancelled! Approval not granted.");
    setIsApproving(false);
  };

  useEffect(() => {
    const checkUSDTAllowance = async () => {
      if (address && usdtContractAddress && contractAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const usdtContract = new ethers.Contract(usdtContractAddress, usdtContractAbi, provider);
        const allowance = await usdtContract.allowance(address, contractAddress);
        setIsUSDTApproved(ethers.utils.formatUnits(allowance, 6) >= amountUSDT);
      }
    };
  
    const checkPILAAllowance = async () => {
      if (address && pilaContractAddress && contractAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const pilaContract = new ethers.Contract(pilaContractAddress, pilaContractAbi, provider);
        const allowance = await pilaContract.allowance(address, contractAddress);
        setIsPILAApproved(ethers.utils.formatUnits(allowance, 6) >= amountPILA);
      }
    };
    const checkPILAAllowanceAndBalance = async () => {
      if (address && pilaContractAddress && contractAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const pilaContract = new ethers.Contract(pilaContractAddress, pilaContractAbi, provider);
        
        // Check for PILA balance
        const balance = await pilaContract.balanceOf(address);
        if (ethers.utils.formatUnits(balance, 6) === '0') {
          setIsPILAApproved(false);
          return;
        }
  
        // Check for allowance if balance is not zero
        const allowance = await pilaContract.allowance(address, contractAddress);
        setIsPILAApproved(ethers.utils.formatUnits(allowance, 6) >= amountPILA);
      }
    };
  

    if (address) {
      setIsUSDTApproved(false);
      checkUSDTAllowance(false);
      checkPILAAllowanceAndBalance();
    }
    
  }, [address, amountUSDT, amountPILA]);


  const calculateReceivedUSDTForSelling = (value) => {
    if (!sellingPrice) return 0; // Return 0 if sellingPrice is not yet fetched
    const receivedUSDT = (value * sellingPrice) / Math.pow(10, 6); // Assuming sellingPrice is in the smallest unit
    return receivedUSDT;
  };

 const calculateRequiredUSDT = (value) => {
    return (value / 5);
  
  };

  const convertToSmallestUnitForBuy = (value) => {
    return value * Math.pow(10, 6);
  };

  return (
    <main className="main">
      <div className="container">
        <h1>Connect your Wallet</h1>
        <ConnectWallet  style={{marginBottom:"2rem"}}/>
        <br/>
        {address ? (
          <div className='card'>
            <h6>Transaction occurs in two steps:</h6>
            <p><b>1- Approve the transfer amount</b></p>
            <p style={{marginBottom:"1rem"}}><b>2- Confirm the swap</b></p>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Tab eventKey="buy" title="Buy">

              <Form.Group>
  <Form.Label></Form.Label>
  <Form.Control
    type="number"
    value={amountPILA}
    onChange={(e) => {
      setAmountPILA(e.target.value);
      setAmountUSDT(calculateRequiredUSDT(e.target.value));
    }}
    placeholder="Enter amount of PILA"
  />
    <Form.Text>Required USDT: {amountUSDT}</Form.Text>
</Form.Group>
{!isUSDTApproved ? (
    <Web3Button
      contractAddress={usdtContractAddress}
      contractAbi={usdtContractAbi}
      action={async (contract) => {
        await contract.call("approve", [contractAddress, ethers.utils.parseUnits(String(amountUSDT), 6)]);
      }}
      onStart={onApproveStart}
      onSuccess={onUSDTApproveSuccess}
      onFailure={onApproveFailure}
    >
Approve    
</Web3Button>
  ) : null}
{isUSDTApproved && (
            <Web3Button
            contractAddress={contractAddress}
            contractAbi={contractAbi}
            action={async (contract) => {
              try {
                await contract.call("BuyPilaWithUSDT", [amountUSDT * Math.pow(10, 6)]);
              } catch (e) {
                alert("Transaction Cancelled");
              }
            }}
            onSuccess={(result) => alert("Purchase Successful!")}

          >
            Buy PILA
          </Web3Button>
          
                )}
 </Tab>


 <Tab eventKey="sell" title="Sell">
 
                <Form.Group>
                  <Form.Label></Form.Label>
                  <Form.Control 
  type="number"
  value={amountPILA}
  onChange={(e) => {
    console.log("Setting amountPILA to: ", e.target.value);
    setAmountPILA(e.target.value);
    setAmountUSDT(calculateRequiredUSDT(e.target.value));
  }}
  placeholder="Enter amount of PILA"
/>

<Form.Text>You will receive approximately {Math.floor(calculateReceivedUSDTForSelling(amountPILA)) === calculateReceivedUSDTForSelling(amountPILA) ? Math.floor(calculateReceivedUSDTForSelling(amountPILA)) : Number(calculateReceivedUSDTForSelling(amountPILA)).toFixed(1)} USDT for selling {amountPILA} PILA</Form.Text>
                </Form.Group>
                {!isPILAApproved ? (
 <Web3Button
                  contractAddress={pilaContractAddress}
                  contractAbi={pilaContractAbi}
                  action={async (contract) => {
                    await contract.call("approve", [contractAddress, ethers.utils.parseUnits(String(amountPILA), 6)]);
                  }}
                  onStart={onApproveStart}
                  onSuccess={onPILAApproveSuccess}
                  onFailure={onApproveFailure}
                >
Approve                </Web3Button>
                  ) : null}
                {isPILAApproved && (
              <Web3Button
              contractAddress={contractAddress}
              contractAbi={contractAbi}
              action={async (contract) => {
                try {
                  const smallestUnit = amountPILA * Math.pow(10, 6);
                  await contract.call("SellPilaForUSDT", [smallestUnit]);
                } catch (e) {
                  alert("Transaction Cancelled");
                }
              }}
              onSuccess={(result) => alert("Sold Successfully!")}
            >
              Sell PILA
            </Web3Button>
            
                )}
              </Tab>
            </Tabs>
          </div>
        ) : ""}
      </div>
    </main>
  );
}
